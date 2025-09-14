import express from 'express';
import OHADAAccount from '../models/OHADAAccount';
import OHADAJournalEntry from '../models/OHADAJournalEntry';
import OHADAAccountingPeriod from '../models/OHADAAccountingPeriod';
import { authMiddleware, requirePermission, AuthRequest } from '../middleware/auth';
import { emitEvent } from '../lib/events';
import { OHADAChartOfAccounts } from '../data/ohadaAccounts';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';

const router = express.Router();
const upload = multer({ dest: 'tmp/' });

// ----- Report Computation Helpers -----
async function computeTrialBalance(opts: { period: string; branch?: any; userBranch?: any; isSuperAdmin?: boolean }) {
  const { period, branch, userBranch, isSuperAdmin } = opts;
  const filter: any = { period, status: 'posted' };
  if (branch) filter.branch = branch;
  if (!isSuperAdmin && userBranch) filter.branch = userBranch;
  const entries = await OHADAJournalEntry.find(filter).populate('lines.account', 'code name type');
  const accountBalances: Record<string, { code: string; name: string; openingDebit: number; openingCredit: number; periodDebit: number; periodCredit: number; closingDebit: number; closingCredit: number; }> = {};
  const [year] = String(period).split('-').map(Number);
  const accountingPeriod = await OHADAAccountingPeriod.findOne({ year, branch: filter.branch });
  if (accountingPeriod?.openingBalances) {
    for (const balance of accountingPeriod.openingBalances) {
      const account = await OHADAAccount.findOne({ code: balance.accountCode });
      if (account) {
        accountBalances[balance.accountCode] = {
          code: balance.accountCode,
          name: account.name,
          openingDebit: balance.debitBalance,
          openingCredit: balance.creditBalance,
          periodDebit: 0,
          periodCredit: 0,
          closingDebit: 0,
          closingCredit: 0
        };
      }
    }
  }
  for (const entry of entries) {
    for (const line of entry.lines) {
      const account = line.account as any;
      const code = account.code;
      if (!accountBalances[code]) {
        accountBalances[code] = { code, name: account.name, openingDebit: 0, openingCredit: 0, periodDebit: 0, periodCredit: 0, closingDebit: 0, closingCredit: 0 };
      }
      accountBalances[code].periodDebit += line.debit;
      accountBalances[code].periodCredit += line.credit;
    }
  }
  for (const balance of Object.values(accountBalances)) {
    const closingDebit = balance.openingDebit + balance.periodDebit;
    const closingCredit = balance.openingCredit + balance.periodCredit;
    balance.closingDebit = closingDebit > closingCredit ? closingDebit - closingCredit : 0;
    balance.closingCredit = closingCredit > closingDebit ? closingCredit - closingDebit : 0;
  }
  const totals = Object.values(accountBalances).reduce((acc, b) => ({
    openingDebit: acc.openingDebit + b.openingDebit,
    openingCredit: acc.openingCredit + b.openingCredit,
    periodDebit: acc.periodDebit + b.periodDebit,
    periodCredit: acc.periodCredit + b.periodCredit,
    closingDebit: acc.closingDebit + b.closingDebit,
    closingCredit: acc.closingCredit + b.closingCredit
  }), { openingDebit:0, openingCredit:0, periodDebit:0, periodCredit:0, closingDebit:0, closingCredit:0 });
  return { period, accounts: Object.values(accountBalances).sort((a,b)=>a.code.localeCompare(b.code)), totals };
}

async function computeBalanceSheet(opts: { period: string; branch?: any; userBranch?: any; isSuperAdmin?: boolean }) {
  const tb = await computeTrialBalance(opts);
  const accounts = tb.accounts;
  const assets = {
    nonCurrentAssets: accounts.filter(acc => acc.code.startsWith('2') && (acc.closingDebit - acc.closingCredit) > 0).map(acc => ({ code: acc.code, name: acc.name, amount: acc.closingDebit - acc.closingCredit })),
    currentAssets: accounts.filter(acc => (acc.code.startsWith('3') || acc.code.startsWith('4') || acc.code.startsWith('5')) && (acc.closingDebit - acc.closingCredit) > 0).map(acc => ({ code: acc.code, name: acc.name, amount: acc.closingDebit - acc.closingCredit })),
    totalAssets: 0
  };
  const liabilitiesAndEquity = {
    equity: accounts.filter(acc => acc.code.startsWith('1') && (acc.closingCredit - acc.closingDebit) > 0).map(acc => ({ code: acc.code, name: acc.name, amount: acc.closingCredit - acc.closingDebit })),
    nonCurrentLiabilities: accounts.filter(acc => acc.code.startsWith('16') && (acc.closingCredit - acc.closingDebit) > 0).map(acc => ({ code: acc.code, name: acc.name, amount: acc.closingCredit - acc.closingDebit })),
    currentLiabilities: accounts.filter(acc => (acc.code.startsWith('4') && !acc.code.startsWith('41')) && (acc.closingCredit - acc.closingDebit) > 0).map(acc => ({ code: acc.code, name: acc.name, amount: acc.closingCredit - acc.closingDebit })),
    totalLiabilitiesAndEquity: 0
  };
  assets.totalAssets = [...assets.nonCurrentAssets, ...assets.currentAssets].reduce((s,i)=>s+i.amount,0);
  liabilitiesAndEquity.totalLiabilitiesAndEquity = [...liabilitiesAndEquity.equity, ...liabilitiesAndEquity.nonCurrentLiabilities, ...liabilitiesAndEquity.currentLiabilities].reduce((s,i)=>s+i.amount,0);
  return { period: tb.period, assets, liabilitiesAndEquity };
}

async function computeIncomeStatement(opts: { period: string; branch?: any; userBranch?: any; isSuperAdmin?: boolean }) {
  const { period, branch, userBranch, isSuperAdmin } = opts;
  const filter: any = { period, status: 'posted' };
  if (branch) filter.branch = branch;
  if (!isSuperAdmin && userBranch) filter.branch = userBranch;
  const entries = await OHADAJournalEntry.find(filter).populate('lines.account', 'code name type');
  const accountTotals: Record<string, { name: string; amount: number; type: string }> = {};
  for (const entry of entries) {
    for (const line of entry.lines) {
      const account = line.account as any;
      const code = account.code;
      if (!accountTotals[code]) accountTotals[code] = { name: account.name, amount: 0, type: account.type };
      if (account.type === 'income') accountTotals[code].amount += line.credit - line.debit;
      else if (account.type === 'expense') accountTotals[code].amount += line.debit - line.credit;
    }
  }
  const revenue:any[] = []; const expenses:any[] = [];
  for (const [code,data] of Object.entries(accountTotals)) {
    if (data.type === 'income' && data.amount > 0) revenue.push({ code, name: data.name, amount: data.amount });
    else if (data.type === 'expense' && data.amount > 0) expenses.push({ code, name: data.name, amount: data.amount });
  }
  const totalRevenue = revenue.reduce((s,i)=>s+i.amount,0);
  const totalExpenses = expenses.reduce((s,i)=>s+i.amount,0);
  return { period, revenue: revenue.sort((a,b)=>a.code.localeCompare(b.code)), expenses: expenses.sort((a,b)=>a.code.localeCompare(b.code)), grossProfit: totalRevenue - totalExpenses, operatingProfit: totalRevenue - totalExpenses, netProfit: totalRevenue - totalExpenses, totalRevenue, totalExpenses };
}

// Initialize OHADA Chart of Accounts
router.post('/accounts/initialize', authMiddleware, requirePermission('accounting'), async (req: AuthRequest, res) => {
  try {
    const existingCount = await OHADAAccount.countDocuments();
    if (existingCount > 0) {
      return res.status(400).json({ error: { message: 'Chart of accounts already initialized' } });
    }

    const accounts = [];
    
    // Create accounts from OHADA standard
    for (const [classCode, classData] of Object.entries(OHADAChartOfAccounts)) {
      // Create class account (level 1)
      const derive = (code: string) => {
        const first = code.charAt(0);
        switch (first) {
          case '1': return { type: 'equity', category: 'non-current' };
          case '2': return { type: 'asset', category: 'non-current' };
          case '3': return { type: 'asset', category: 'current' };
          case '4': return { type: 'liability', category: 'current' };
          case '5': return { type: 'asset', category: 'current' };
          case '6': return { type: 'expense', category: 'operating' };
          case '7': return { type: 'income', category: 'operating' };
          case '8': return { type: 'asset', category: 'extraordinary' };
          default: return { type: 'asset', category: 'current' };
        }
      };
      const classDeriv = derive(classCode);
      accounts.push({
        code: classCode,
        name: classData.name,
        level: 1,
        isActive: true,
        createdBy: req.user?.id,
        type: classDeriv.type,
        category: classDeriv.category
      });

      // Create individual accounts (level 2-4)
      for (const [accountCode, accountName] of Object.entries(classData.accounts)) {
        const { type, category } = derive(accountCode);
        accounts.push({
          code: accountCode,
          name: accountName,
          level: accountCode.length,
          parentCode: accountCode.length > 1 ? accountCode.substring(0, accountCode.length - 1) : classCode,
          isActive: true,
          createdBy: req.user?.id,
          type,
          category
        });
      }
    }

    await OHADAAccount.insertMany(accounts);
    
    res.json({ message: `${accounts.length} OHADA accounts created successfully` });
  } catch (err: any) {
    console.error('POST /api/ohada/accounts/initialize error', err);
    res.status(500).json({ error: { message: 'Failed to initialize chart of accounts' } });
  }
});

// Get OHADA accounts
router.get('/accounts', authMiddleware, requirePermission('accounting'), async (req: AuthRequest, res) => {
  try {
    const { level, type, search, active } = req.query;
    const filter: any = {};
    
    if (level) filter.level = parseInt(level as string);
    if (type) filter.type = type;
    if (active !== undefined) filter.isActive = active === 'true';
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      filter.$or = [
        { code: searchRegex },
        { name: searchRegex }
      ];
    }

    const accounts = await OHADAAccount.find(filter)
      .sort({ code: 1 })
      .populate('createdBy', 'name');

    res.json({ data: accounts });
  } catch (err: any) {
    console.error('GET /api/ohada/accounts error', err);
    res.status(500).json({ error: { message: 'Failed to fetch accounts' } });
  }
});

// Create OHADA account
router.post('/accounts', authMiddleware, requirePermission('accounting'), async (req: AuthRequest, res) => {
  try {
    const { code, name, description, parentCode, type: requestedType, category: requestedCategory } = req.body;
    
    if (!code || !name) {
      return res.status(400).json({ error: { message: 'Code and name are required' } });
    }

    // Validate OHADA code format
    if (!/^[1-8]\d{0,3}$/.test(code)) {
      return res.status(400).json({ error: { message: 'Invalid OHADA account code format' } });
    }

    // Check if account already exists
    const existing = await OHADAAccount.findOne({ code });
    if (existing) {
      return res.status(400).json({ error: { message: 'Account code already exists' } });
    }

    // Derive preliminary type & category BEFORE validation (pre-save runs after validation)
    let derivedType: any = 'asset';
    let derivedCategory: any = 'current';
    const firstDigit = code.charAt(0);
    switch (firstDigit) {
      case '1':
        derivedType = 'equity';
        derivedCategory = 'non-current';
        break;
      case '2':
        derivedType = 'asset';
        derivedCategory = 'non-current';
        break;
      case '3':
        derivedType = 'asset';
        derivedCategory = 'current';
        break;
      case '4':
        if (code.startsWith('41') || code.startsWith('46')) {
          derivedType = 'asset';
        } else {
          derivedType = 'liability';
        }
        derivedCategory = 'current';
        break;
      case '5':
        derivedType = 'asset';
        derivedCategory = 'current';
        break;
      case '6':
        derivedType = 'expense';
        if (code.startsWith('64') || code.startsWith('65')) {
          derivedCategory = 'financial';
        } else if (code.startsWith('69')) {
          derivedCategory = 'extraordinary';
        } else {
          derivedCategory = 'operating';
        }
        break;
      case '7':
        derivedType = 'income';
        if (code.startsWith('74') || code.startsWith('75')) {
          derivedCategory = 'financial';
        } else if (code.startsWith('79')) {
          derivedCategory = 'extraordinary';
        } else {
          derivedCategory = 'operating';
        }
        break;
      case '8':
        derivedType = 'asset';
        derivedCategory = 'extraordinary';
        break;
    }

    // Allow optional override if client explicitly sends valid type/category matching enums
    const validTypes = ['asset','liability','equity','income','expense'];
    const validCategories = ['current','non-current','operating','financial','extraordinary'];
    if (requestedType && validTypes.includes(requestedType)) {
      derivedType = requestedType;
    }
    if (requestedCategory && validCategories.includes(requestedCategory)) {
      derivedCategory = requestedCategory;
    }

    const manualProvided = !!(requestedType || requestedCategory);
    const account = new OHADAAccount({
      code,
      name,
      description,
      parentCode,
      level: code.length,
      type: derivedType,
      category: derivedCategory,
      createdBy: req.user?.id,
      branch: req.user?.isSuperAdmin ? req.body.branch : req.user?.branch,
      // transient marker not in schema; will be ignored by mongoose but present pre-save via this.get() check if needed later
      _manualProvided: manualProvided ? true as any : undefined
    } as any);

    await account.save();
    
    const populatedAccount = await OHADAAccount.findById(account._id)
      .populate('createdBy', 'name');

    res.status(201).json({ data: populatedAccount });
  } catch (err: any) {
    console.error('POST /api/ohada/accounts error', err);
    res.status(500).json({ error: { message: 'Failed to create account' } });
  }
});

// Get journal entries
router.get('/journal', authMiddleware, requirePermission('accounting'), async (req: AuthRequest, res) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1'));
    const limit = Math.max(10, parseInt((req.query.limit as string) || '20'));
    const skip = (page - 1) * limit;

    const filter: any = {};
    
    // Branch filtering
    if (!req.user?.isSuperAdmin && req.user?.branch) {
      filter.branch = req.user.branch;
    } else if (req.query.branch) {
      filter.branch = req.query.branch;
    }

    if (req.query.period) filter.period = req.query.period;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      filter.$or = [
        { entryNumber: searchRegex },
        { reference: searchRegex },
        { description: searchRegex }
      ];
    }

    const total = await OHADAJournalEntry.countDocuments(filter);
    const entries = await OHADAJournalEntry.find(filter)
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name')
      .populate('lines.account', 'code name')
      .sort({ date: -1, entryNumber: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ data: entries, meta: { total, page, limit } });
  } catch (err: any) {
    console.error('GET /api/ohada/journal error', err);
    res.status(500).json({ error: { message: 'Failed to fetch journal entries' } });
  }
});

// Create journal entry
router.post('/journal', authMiddleware, requirePermission('accounting'), async (req: AuthRequest, res) => {
  try {
    const { date, reference, description, lines } = req.body;

    if (!date || !reference || !description || !lines || lines.length === 0) {
      return res.status(400).json({ error: { message: 'Missing required fields' } });
    }

    // Determine branch
    const branch = req.user?.isSuperAdmin ? req.body.branch : req.user?.branch;
    if (!branch) {
      return res.status(400).json({ error: { message: 'Branch is required' } });
    }

    // Validate that debits equal credits (frontend also checks)
    const totalDebits = lines.reduce((sum: number, line: any) => sum + (line.debit || 0), 0);
    const totalCredits = lines.reduce((sum: number, line: any) => sum + (line.credit || 0), 0);
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return res.status(400).json({ error: { message: 'Debits must equal credits' } });
    }

    // Validate accounts exist
    const accountIds = lines.map((line: any) => line.account).filter((id: any) => !!id);
    const accounts = await OHADAAccount.find({ _id: { $in: accountIds } });
    if (accounts.length !== accountIds.length) {
      const foundIdSet = new Set(accounts.map(a => a._id.toString()));
      const missing = accountIds.filter((id: any) => !foundIdSet.has(id.toString()));
      return res.status(400).json({ error: { message: 'One or more accounts not found', missingAccounts: missing } });
    }

    // Enrich lines
    const enrichedLines = lines.map((line: any) => {
      const account = accounts.find(acc => acc._id.toString() === line.account);
      return { ...line, accountCode: account?.code, accountName: account?.name };
    });

    const entry = new OHADAJournalEntry({
      date: new Date(date),
      reference,
      description,
      lines: enrichedLines,
      createdBy: req.user?.id,
      branch
    });

    await entry.save();

    const populatedEntry = await OHADAJournalEntry.findById(entry._id)
      .populate('createdBy', 'name')
      .populate('lines.account', 'code name');

    try { emitEvent(entry.branch.toString(), 'ohada.journal.created', { entry: populatedEntry }); } catch (e) {}

    return res.status(201).json({ data: populatedEntry });
  } catch (err: any) {
    // Surface validation errors clearly
    if (err?.name === 'ValidationError') {
      const fieldErrors: Record<string, string> = {};
      for (const [k, v] of Object.entries(err.errors || {})) {
        // @ts-ignore
        fieldErrors[k] = v.message;
      }
      return res.status(400).json({ error: { message: 'Validation failed', fieldErrors } });
    }
    console.error('POST /api/ohada/journal error', err);
    return res.status(500).json({ error: { message: 'Failed to create journal entry' } });
  }
});

// Post journal entry (make it official)
router.post('/journal/:id/post', authMiddleware, requirePermission('accounting'), async (req: AuthRequest, res) => {
  try {
    const entry = await OHADAJournalEntry.findById(req.params.id)
      .populate('lines.account');
    
    if (!entry) {
      return res.status(404).json({ error: { message: 'Journal entry not found' } });
    }

    if (entry.status !== 'draft') {
      return res.status(400).json({ error: { message: 'Only draft entries can be posted' } });
    }

    // Update account balances
    for (const line of entry.lines) {
      const account = await OHADAAccount.findById(line.account);
      if (account) {
        account.debitBalance += line.debit;
        account.creditBalance += line.credit;
        
        // Calculate net balance based on account type
        if (['asset', 'expense'].includes(account.type)) {
          account.balance = account.debitBalance - account.creditBalance;
        } else {
          account.balance = account.creditBalance - account.debitBalance;
        }
        
        await account.save();
      }
    }

    entry.status = 'posted';
    entry.approvedBy = req.user?.id as any;
    await entry.save();

    const populatedEntry = await OHADAJournalEntry.findById(entry._id)
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name')
      .populate('lines.account', 'code name');

    try {
      emitEvent(entry.branch.toString(), 'ohada.journal.posted', { entry: populatedEntry });
    } catch (e) {}

    res.json({ data: populatedEntry });
  } catch (err: any) {
    console.error('POST /api/ohada/journal/:id/post error', err);
    res.status(500).json({ error: { message: 'Failed to post journal entry' } });
  }
});

// Generate Trial Balance
router.get('/reports/trial-balance', authMiddleware, requirePermission('accounting'), async (req: AuthRequest, res) => {
  try {
    const { period, branch } = req.query;
    
    if (!period) {
      return res.status(400).json({ error: { message: 'Period is required' } });
    }
    const periodStr = String(period);
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(periodStr)) {
      return res.status(400).json({ error: { message: 'Invalid period format. Use YYYY-MM' } });
    }

    const filter: any = { period, status: 'posted' };
    if (branch) filter.branch = branch;
    if (!req.user?.isSuperAdmin && req.user?.branch) {
      filter.branch = req.user.branch;
    }

    // Get all posted journal entries for the period
    const entries = await OHADAJournalEntry.find(filter)
      .populate('lines.account', 'code name type');

    // Calculate account balances
    const accountBalances: Record<string, {
      code: string;
      name: string;
      openingDebit: number;
      openingCredit: number;
      periodDebit: number;
      periodCredit: number;
      closingDebit: number;
      closingCredit: number;
    }> = {};

    // Get opening balances from previous period or accounting period
  const [year, month] = String(period).split('-').map(Number);
    const accountingPeriod = await OHADAAccountingPeriod.findOne({ 
      year, 
      branch: filter.branch 
    });

    // Initialize with opening balances
    if (accountingPeriod?.openingBalances) {
      for (const balance of accountingPeriod.openingBalances) {
        const account = await OHADAAccount.findOne({ code: balance.accountCode });
        if (account) {
          accountBalances[balance.accountCode] = {
            code: balance.accountCode,
            name: account.name,
            openingDebit: balance.debitBalance,
            openingCredit: balance.creditBalance,
            periodDebit: 0,
            periodCredit: 0,
            closingDebit: 0,
            closingCredit: 0
          };
        }
      }
    }

    // Process journal entries
    for (const entry of entries) {
      for (const line of entry.lines) {
        const account = line.account as any;
        const code = account.code;
        
        if (!accountBalances[code]) {
          accountBalances[code] = {
            code,
            name: account.name,
            openingDebit: 0,
            openingCredit: 0,
            periodDebit: 0,
            periodCredit: 0,
            closingDebit: 0,
            closingCredit: 0
          };
        }
        
        accountBalances[code].periodDebit += line.debit;
        accountBalances[code].periodCredit += line.credit;
      }
    }

    // Calculate closing balances
    for (const balance of Object.values(accountBalances)) {
      balance.closingDebit = balance.openingDebit + balance.periodDebit;
      balance.closingCredit = balance.openingCredit + balance.periodCredit;
    }

    // Calculate totals
    const totals = Object.values(accountBalances).reduce((acc, balance) => ({
      openingDebit: acc.openingDebit + balance.openingDebit,
      openingCredit: acc.openingCredit + balance.openingCredit,
      periodDebit: acc.periodDebit + balance.periodDebit,
      periodCredit: acc.periodCredit + balance.periodCredit,
      closingDebit: acc.closingDebit + balance.closingDebit,
      closingCredit: acc.closingCredit + balance.closingCredit
    }), {
      openingDebit: 0,
      openingCredit: 0,
      periodDebit: 0,
      periodCredit: 0,
      closingDebit: 0,
      closingCredit: 0
    });

    const trialBalance = {
      period,
      accounts: Object.values(accountBalances).sort((a, b) => a.code.localeCompare(b.code)),
      totals
    };

    res.json({ data: trialBalance });
  } catch (err: any) {
    console.error('GET /api/ohada/reports/trial-balance error', err);
    res.status(500).json({ error: { message: 'Failed to generate trial balance' } });
  }
});

// Generate Balance Sheet
router.get('/reports/balance-sheet', authMiddleware, requirePermission('accounting'), async (req: AuthRequest, res) => {
  try {
    const { period, branch } = req.query;
    
    if (!period) {
      return res.status(400).json({ error: { message: 'Period is required' } });
    }

    // Get trial balance data
    const trialBalanceRes = await fetch(`${req.protocol}://${req.get('host')}/api/ohada/reports/trial-balance?period=${period}&branch=${branch || ''}`);
    const trialBalanceData = await trialBalanceRes.json();
    const accounts = trialBalanceData.data.accounts;

    // Categorize accounts for balance sheet
    const assets = {
      nonCurrentAssets: accounts.filter((acc: any) => 
        acc.code.startsWith('2') && (acc.closingDebit - acc.closingCredit) > 0
      ).map((acc: any) => ({
        code: acc.code,
        name: acc.name,
        amount: acc.closingDebit - acc.closingCredit
      })),
      currentAssets: accounts.filter((acc: any) => 
        (acc.code.startsWith('3') || acc.code.startsWith('4') || acc.code.startsWith('5')) && 
        (acc.closingDebit - acc.closingCredit) > 0
      ).map((acc: any) => ({
        code: acc.code,
        name: acc.name,
        amount: acc.closingDebit - acc.closingCredit
      })),
      totalAssets: 0
    };

    const liabilitiesAndEquity = {
      equity: accounts.filter((acc: any) => 
        acc.code.startsWith('1') && (acc.closingCredit - acc.closingDebit) > 0
      ).map((acc: any) => ({
        code: acc.code,
        name: acc.name,
        amount: acc.closingCredit - acc.closingDebit
      })),
      nonCurrentLiabilities: accounts.filter((acc: any) => 
        acc.code.startsWith('16') && (acc.closingCredit - acc.closingDebit) > 0
      ).map((acc: any) => ({
        code: acc.code,
        name: acc.name,
        amount: acc.closingCredit - acc.closingDebit
      })),
      currentLiabilities: accounts.filter((acc: any) => 
        (acc.code.startsWith('4') && !acc.code.startsWith('41')) && 
        (acc.closingCredit - acc.closingDebit) > 0
      ).map((acc: any) => ({
        code: acc.code,
        name: acc.name,
        amount: acc.closingCredit - acc.closingDebit
      })),
      totalLiabilitiesAndEquity: 0
    };

    // Calculate totals
    assets.totalAssets = [...assets.nonCurrentAssets, ...assets.currentAssets]
      .reduce((sum, item) => sum + item.amount, 0);
    
    liabilitiesAndEquity.totalLiabilitiesAndEquity = [
      ...liabilitiesAndEquity.equity, 
      ...liabilitiesAndEquity.nonCurrentLiabilities, 
      ...liabilitiesAndEquity.currentLiabilities
    ].reduce((sum, item) => sum + item.amount, 0);

    const balanceSheet = {
      period,
      assets,
      liabilitiesAndEquity
    };

    res.json({ data: balanceSheet });
  } catch (err: any) {
    console.error('GET /api/ohada/reports/balance-sheet error', err);
    res.status(500).json({ error: { message: 'Failed to generate balance sheet' } });
  }
});

// Generate Income Statement
router.get('/reports/income-statement', authMiddleware, requirePermission('accounting'), async (req: AuthRequest, res) => {
  try {
    const { period, branch } = req.query;
    
    if (!period) {
      return res.status(400).json({ error: { message: 'Period is required' } });
    }

    const filter: any = { period, status: 'posted' };
    if (branch) filter.branch = branch;
    if (!req.user?.isSuperAdmin && req.user?.branch) {
      filter.branch = req.user.branch;
    }

    const entries = await OHADAJournalEntry.find(filter)
      .populate('lines.account', 'code name type');

    // Calculate revenue and expenses
    const revenue: Array<{ code: string; name: string; amount: number }> = [];
    const expenses: Array<{ code: string; name: string; amount: number }> = [];
    
    const accountTotals: Record<string, { name: string; amount: number; type: string }> = {};

    for (const entry of entries) {
      for (const line of entry.lines) {
        const account = line.account as any;
        const code = account.code;
        
        if (!accountTotals[code]) {
          accountTotals[code] = {
            name: account.name,
            amount: 0,
            type: account.type
          };
        }
        
        if (account.type === 'income') {
          accountTotals[code].amount += line.credit - line.debit;
        } else if (account.type === 'expense') {
          accountTotals[code].amount += line.debit - line.credit;
        }
      }
    }

    // Separate into revenue and expenses
    for (const [code, data] of Object.entries(accountTotals)) {
      if (data.type === 'income' && data.amount > 0) {
        revenue.push({ code, name: data.name, amount: data.amount });
      } else if (data.type === 'expense' && data.amount > 0) {
        expenses.push({ code, name: data.name, amount: data.amount });
      }
    }

    const totalRevenue = revenue.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);

    const incomeStatement = {
      period,
      revenue: revenue.sort((a, b) => a.code.localeCompare(b.code)),
      expenses: expenses.sort((a, b) => a.code.localeCompare(b.code)),
      grossProfit: totalRevenue - totalExpenses,
      operatingProfit: totalRevenue - totalExpenses, // Simplified
      netProfit: totalRevenue - totalExpenses,
      totalRevenue,
      totalExpenses
    };

    res.json({ data: incomeStatement });
  } catch (err: any) {
    console.error('GET /api/ohada/reports/income-statement error', err);
    res.status(500).json({ error: { message: 'Failed to generate income statement' } });
  }
});

// Export reports
router.get('/reports/:reportType/export', authMiddleware, requirePermission('accounting'), async (req: AuthRequest, res) => {
  try {
    let { reportType } = req.params;
    const { period, format = 'excel', branch } = req.query;

    if (!period) {
      return res.status(400).json({ error: { message: 'Period is required' } });
    }

    // Normalize report type aliases (hyphen, underscore, camelCase)
    const originalReportType = reportType;
    reportType = reportType
      .replace(/-/g, '_')                // hyphen to underscore
      .replace(/([a-z])([A-Z])/g, '$1_$2') // camelCase to snake
      .toLowerCase();

    const allowed: Record<string, string> = {
      trial_balance: 'trial-balance',
      balance_sheet: 'balance-sheet',
      income_statement: 'income-statement'
    };

    if (!allowed[reportType]) {
      console.warn('OHADA export invalid reportType received', { originalReportType, normalized: reportType });
      return res.status(400).json({ error: { message: 'Invalid report type' } });
    }

  // Get report data (reuse existing internal endpoints)
    let reportData: any;
    switch (reportType) {
      case 'trial_balance':
        reportData = { data: await computeTrialBalance({ period: String(period), branch, userBranch: req.user?.branch, isSuperAdmin: req.user?.isSuperAdmin }) };
        break;
      case 'balance_sheet':
        reportData = { data: await computeBalanceSheet({ period: String(period), branch, userBranch: req.user?.branch, isSuperAdmin: req.user?.isSuperAdmin }) };
        break;
      case 'income_statement':
        reportData = { data: await computeIncomeStatement({ period: String(period), branch, userBranch: req.user?.branch, isSuperAdmin: req.user?.isSuperAdmin }) };
        break;
      default:
        return res.status(400).json({ error: { message: 'Invalid report type' } });
    }

    // Basic validation of fetched data shape
    if (!reportData || !reportData.data) {
      const upstreamError = reportData && (reportData.error || reportData.message);
      console.warn('OHADA export missing data', { reportType, originalReportType, period, branch, upstreamError, fetchedKeys: reportData && Object.keys(reportData || {}) });
      return res.status(500).json({ error: { message: upstreamError || 'Report data unavailable for export' } });
    }

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(reportType.replace('_', ' ').toUpperCase());

  const generatedAt = new Date();
  const branchLabel = branch ? `Branch: ${branch}` : (req.user?.branch ? `Branch: ${req.user.branch}` : 'All Branches');
  worksheet.mergeCells('A1:F1');
  worksheet.getCell('A1').value = `OHADA ${reportType.replace('_', ' ').toUpperCase()} Report`;
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };
  worksheet.mergeCells('A2:F2');
  worksheet.getCell('A2').value = `Period: ${period}   ${branchLabel}`;
  worksheet.getCell('A2').alignment = { horizontal: 'center' };
  worksheet.mergeCells('A3:F3');
  worksheet.getCell('A3').value = `Generated At: ${generatedAt.toISOString()}`;
  worksheet.getCell('A3').font = { italic: true, size: 10 };
  worksheet.getCell('A3').alignment = { horizontal: 'center' };

      // Add headers and data based on report type
  if (reportType === 'trial_balance') {
        const headers = ['Account Code', 'Account Name', 'Opening Debit', 'Opening Credit', 'Period Debit', 'Period Credit', 'Closing Debit', 'Closing Credit'];
        worksheet.addRow(headers);
        
  const headerRow = worksheet.getRow(4);
        headerRow.font = { bold: true };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E6FA' } };

        for (const account of reportData.data.accounts) {
          worksheet.addRow([
            account.code,
            account.name,
            account.openingDebit,
            account.openingCredit,
            account.periodDebit,
            account.periodCredit,
            account.closingDebit,
            account.closingCredit
          ]);
        }

        // Add totals row
        const totalsRow = worksheet.addRow([
          'TOTALS',
          '',
          reportData.data.totals.openingDebit,
          reportData.data.totals.openingCredit,
          reportData.data.totals.periodDebit,
          reportData.data.totals.periodCredit,
          reportData.data.totals.closingDebit,
          reportData.data.totals.closingCredit
        ]);
        totalsRow.font = { bold: true };
        totalsRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD700' } };
      } else if (reportType === 'balance_sheet') {
        // Balance Sheet: two sections (Assets, Liabilities & Equity)
        worksheet.addRow(['SECTION', 'CODE', 'NAME', 'AMOUNT']);
  const headerRow = worksheet.getRow(4);
        headerRow.font = { bold: true };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E6FA' } };

        const bs = reportData.data;
        worksheet.addRow(['Assets', '', '', '']).font = { bold: true } as any;
        worksheet.addRow([' Non-Current Assets', '', '', '']);
        bs.assets.nonCurrentAssets.forEach((a: any) => worksheet.addRow(['', a.code, a.name, a.amount]));
        worksheet.addRow([' Current Assets', '', '', '']);
        bs.assets.currentAssets.forEach((a: any) => worksheet.addRow(['', a.code, a.name, a.amount]));
        worksheet.addRow([' Total Assets', '', '', bs.assets.totalAssets]).font = { bold: true } as any;

        worksheet.addRow(['Liabilities & Equity', '', '', '']).font = { bold: true } as any;
        worksheet.addRow([' Equity', '', '', '']);
        bs.liabilitiesAndEquity.equity.forEach((a: any) => worksheet.addRow(['', a.code, a.name, a.amount]));
        worksheet.addRow([' Non-Current Liabilities', '', '', '']);
        bs.liabilitiesAndEquity.nonCurrentLiabilities.forEach((a: any) => worksheet.addRow(['', a.code, a.name, a.amount]));
        worksheet.addRow([' Current Liabilities', '', '', '']);
        bs.liabilitiesAndEquity.currentLiabilities.forEach((a: any) => worksheet.addRow(['', a.code, a.name, a.amount]));
        worksheet.addRow([' Total Liabilities & Equity', '', '', bs.liabilitiesAndEquity.totalLiabilitiesAndEquity]).font = { bold: true } as any;
      } else if (reportType === 'income_statement') {
        worksheet.addRow(['SECTION', 'CODE', 'NAME', 'AMOUNT']);
        const headerRow = worksheet.getRow(3);
        headerRow.font = { bold: true };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E6FA' } };

        const isData = reportData.data;
        worksheet.addRow(['Revenue', '', '', '']).font = { bold: true } as any;
        isData.revenue.forEach((r: any) => worksheet.addRow(['', r.code, r.name, r.amount]));
        worksheet.addRow(['Total Revenue', '', '', isData.totalRevenue]).font = { bold: true } as any;
        worksheet.addRow(['Expenses', '', '', '']).font = { bold: true } as any;
        isData.expenses.forEach((e: any) => worksheet.addRow(['', e.code, e.name, e.amount]));
        worksheet.addRow(['Total Expenses', '', '', isData.totalExpenses]).font = { bold: true } as any;
        worksheet.addRow(['Net Profit', '', '', isData.netProfit]).font = { bold: true } as any;
      }

      // Auto-fit columns
      // Determine optimal column widths based on cell contents
      worksheet.columns.forEach((column) => {
        if (!column) return;
        let maxLength = 10; // minimum width
        if (typeof (column as any).eachCell === 'function') {
          (column as any).eachCell({ includeEmpty: true }, (cell: any) => {
            const v = cell.value as any;
            let text = '';
            if (v == null) text = '';
            else if (typeof v === 'object' && 'richText' in (v as any)) {
              text = (v as any).richText.map((r: any) => r.text).join('');
            } else {
              text = v.toString();
            }
            if (text.length > maxLength) maxLength = text.length;
          });
        }
        column.width = Math.min(Math.max(maxLength + 2, 10), 50); // clamp reasonable width
      });

      // Apply number formatting for numeric columns depending on report type
      if (reportType === 'trial_balance') {
        // Columns C..H are numeric (3..8 index 1-based)
        ['C','D','E','F','G','H'].forEach(col => {
          const colRef = worksheet.getColumn(col);
          colRef.numFmt = '#,##0.00';
        });
      } else if (reportType === 'balance_sheet' || reportType === 'income_statement') {
        // Amount column is D for balance sheet & income statement layout
        const amountCol = worksheet.getColumn('D');
        amountCol.numFmt = '#,##0.00';
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="ohada-${reportType}-${period}.xlsx"`);
      
      await workbook.xlsx.write(res);
      res.end();
    } else if (format === 'pdf') {
      // Create PDF only after validation to prevent write-after-end on early return
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="ohada-${reportType}-${period}.pdf"`);
      doc.pipe(res);

  const generatedAtPdf = new Date();
  const branchLabelPdf = branch ? `Branch: ${branch}` : (req.user?.branch ? `Branch: ${req.user.branch}` : 'All Branches');
  doc.fontSize(18).text(`OHADA ${reportType.replace('_', ' ').toUpperCase()} Report`, { align: 'center' });
  doc.fontSize(12).text(`Period: ${period}   ${branchLabelPdf}`, { align: 'center' });
  doc.fontSize(9).fillColor('gray').text(`Generated At: ${generatedAtPdf.toISOString()}`, { align: 'center' }).fillColor('black');
      doc.moveDown();

      // Add content based on report type
  if (reportType === 'trial_balance') {
        // Create table
        const tableTop = doc.y;
        const tableLeft = 40;
        const colWidths = [60, 150, 60, 60, 60, 60, 60, 60];
        
        // Headers
        const headers = ['Code', 'Account Name', 'Op. Dr', 'Op. Cr', 'Per. Dr', 'Per. Cr', 'Cl. Dr', 'Cl. Cr'];
        let x = tableLeft;
        headers.forEach((header, i) => {
          doc.fontSize(10).text(header, x, tableTop, { width: colWidths[i] });
          x += colWidths[i];
        });
        
        doc.moveDown();
        
        // Data rows
        for (const account of reportData.data.accounts) {
          x = tableLeft;
          const values = [
            account.code,
            account.name,
            account.openingDebit.toLocaleString(),
            account.openingCredit.toLocaleString(),
            account.periodDebit.toLocaleString(),
            account.periodCredit.toLocaleString(),
            account.closingDebit.toLocaleString(),
            account.closingCredit.toLocaleString()
          ];
          
          values.forEach((value, i) => {
            doc.fontSize(9).text(value.toString(), x, doc.y, { width: colWidths[i] });
            x += colWidths[i];
          });
          doc.moveDown(0.5);
        }
      } else if (reportType === 'balance_sheet') {
        const bs = reportData.data;
        if (!bs || !bs.assets || !bs.liabilitiesAndEquity) {
          doc.fontSize(12).fillColor('red').text('Balance Sheet data incomplete.');
          doc.end();
          return;
        }
        doc.fontSize(14).text('Assets', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).text('Non-Current Assets');
        bs.assets.nonCurrentAssets.forEach((a: any) => doc.fontSize(10).text(`${a.code}  ${a.name}  ${a.amount.toLocaleString()}`));
        doc.fontSize(12).text('Current Assets');
        bs.assets.currentAssets.forEach((a: any) => doc.fontSize(10).text(`${a.code}  ${a.name}  ${a.amount.toLocaleString()}`));
        doc.fontSize(11).text(`Total Assets: ${bs.assets.totalAssets.toLocaleString()}`, { continued: false });
        doc.moveDown();
        doc.fontSize(14).text('Liabilities & Equity', { underline: true });
        doc.fontSize(12).text('Equity');
        bs.liabilitiesAndEquity.equity.forEach((a: any) => doc.fontSize(10).text(`${a.code}  ${a.name}  ${a.amount.toLocaleString()}`));
        doc.fontSize(12).text('Non-Current Liabilities');
        bs.liabilitiesAndEquity.nonCurrentLiabilities.forEach((a: any) => doc.fontSize(10).text(`${a.code}  ${a.name}  ${a.amount.toLocaleString()}`));
        doc.fontSize(12).text('Current Liabilities');
        bs.liabilitiesAndEquity.currentLiabilities.forEach((a: any) => doc.fontSize(10).text(`${a.code}  ${a.name}  ${a.amount.toLocaleString()}`));
        doc.fontSize(11).text(`Total Liabilities & Equity: ${bs.liabilitiesAndEquity.totalLiabilitiesAndEquity.toLocaleString()}`);
      } else if (reportType === 'income_statement') {
        const isData = reportData.data;
        if (!isData || !isData.revenue || !isData.expenses) {
          doc.fontSize(12).fillColor('red').text('Income Statement data incomplete.');
          doc.end();
          return;
        }
        doc.fontSize(14).text('Revenue', { underline: true });
        isData.revenue.forEach((r: any) => doc.fontSize(10).text(`${r.code}  ${r.name}  ${r.amount.toLocaleString()}`));
        doc.fontSize(11).text(`Total Revenue: ${isData.totalRevenue.toLocaleString()}`);
        doc.moveDown();
        doc.fontSize(14).text('Expenses', { underline: true });
        isData.expenses.forEach((e: any) => doc.fontSize(10).text(`${e.code}  ${e.name}  ${e.amount.toLocaleString()}`));
        doc.fontSize(11).text(`Total Expenses: ${isData.totalExpenses.toLocaleString()}`);
        doc.moveDown();
        doc.fontSize(12).text(`Net Profit: ${isData.netProfit.toLocaleString()}`);
  }

      doc.end();
    } else {
  // CSV format
  const csvData = [];
      
  if (reportType === 'trial_balance') {
        csvData.push(['Account Code', 'Account Name', 'Opening Debit', 'Opening Credit', 'Period Debit', 'Period Credit', 'Closing Debit', 'Closing Credit']);
        
        for (const account of reportData.data.accounts) {
          csvData.push([
            account.code,
            account.name,
            account.openingDebit,
            account.openingCredit,
            account.periodDebit,
            account.periodCredit,
            account.closingDebit,
            account.closingCredit
          ]);
        }
      } else if (reportType === 'balance_sheet') {
        csvData.push(['SECTION', 'CODE', 'NAME', 'AMOUNT']);
        const bs = reportData.data;
        csvData.push(['Assets', '', '', '']);
        csvData.push([' Non-Current Assets', '', '', '']);
        bs.assets.nonCurrentAssets.forEach((a: any) => csvData.push(['', a.code, a.name, a.amount]));
        csvData.push([' Current Assets', '', '', '']);
        bs.assets.currentAssets.forEach((a: any) => csvData.push(['', a.code, a.name, a.amount]));
        csvData.push([' Total Assets', '', '', bs.assets.totalAssets]);
        csvData.push(['Liabilities & Equity', '', '', '']);
        csvData.push([' Equity', '', '', '']);
        bs.liabilitiesAndEquity.equity.forEach((a: any) => csvData.push(['', a.code, a.name, a.amount]));
        csvData.push([' Non-Current Liabilities', '', '', '']);
        bs.liabilitiesAndEquity.nonCurrentLiabilities.forEach((a: any) => csvData.push(['', a.code, a.name, a.amount]));
        csvData.push([' Current Liabilities', '', '', '']);
        bs.liabilitiesAndEquity.currentLiabilities.forEach((a: any) => csvData.push(['', a.code, a.name, a.amount]));
        csvData.push([' Total Liabilities & Equity', '', '', bs.liabilitiesAndEquity.totalLiabilitiesAndEquity]);
      } else if (reportType === 'income_statement') {
        const isData = reportData.data;
        csvData.push(['SECTION', 'CODE', 'NAME', 'AMOUNT']);
        csvData.push(['Revenue', '', '', '']);
        isData.revenue.forEach((r: any) => csvData.push(['', r.code, r.name, r.amount]));
        csvData.push(['Total Revenue', '', '', isData.totalRevenue]);
        csvData.push(['Expenses', '', '', '']);
        isData.expenses.forEach((e: any) => csvData.push(['', e.code, e.name, e.amount]));
        csvData.push(['Total Expenses', '', '', isData.totalExpenses]);
        csvData.push(['Net Profit', '', '', isData.netProfit]);
      }

      const csv = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="ohada-${reportType}-${period}.csv"`);
      res.send(csv);
    }
  } catch (err: any) {
    console.error('GET /api/ohada/reports/:reportType/export error', err);
    res.status(500).json({ error: { message: 'Failed to export report' } });
  }
});

// Import journal entries from Excel/CSV
router.post('/journal/import', authMiddleware, requirePermission('accounting'), upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } });
    }

    const imported: any[] = [];
    const errors: string[] = [];

    if (req.file.mimetype === 'text/csv') {
      // Process CSV file
      const results: any[] = [];
      
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          for (const row of results) {
            try {
              // Validate and create journal entry
              const entry = new OHADAJournalEntry({
                date: new Date(row.date),
                reference: row.reference,
                description: row.description,
                lines: JSON.parse(row.lines), // Assuming lines are JSON encoded
                createdBy: req.user?.id,
                branch: req.user?.branch
              });
              
              await entry.save();
              imported.push(entry);
            } catch (error: any) {
              errors.push(`Row ${results.indexOf(row) + 1}: ${error.message}`);
            }
          }
          
          // Clean up uploaded file
          fs.unlinkSync(req.file!.path);
          
          res.json({ data: { imported: imported.length, errors } });
        });
    } else {
      // Process Excel file
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(req.file.path);
      
      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        return res.status(400).json({ error: { message: 'No worksheet found in Excel file' } });
      }

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row
        
        try {
          // Process Excel row data
          const [date, reference, description, ...lineData] = row.values as any[];
          
          // Create journal entry from Excel data
          // Implementation would depend on Excel format structure
          
        } catch (error: any) {
          errors.push(`Row ${rowNumber}: ${error.message}`);
        }
      });

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      res.json({ data: { imported: imported.length, errors } });
    }
  } catch (err: any) {
    console.error('POST /api/ohada/journal/import error', err);
    res.status(500).json({ error: { message: 'Failed to import journal entries' } });
  }
});

// Accounting periods management
router.get('/periods', authMiddleware, requirePermission('accounting'), async (req: AuthRequest, res) => {
  try {
    const filter: any = {};
    
    if (!req.user?.isSuperAdmin && req.user?.branch) {
      filter.branch = req.user.branch;
    } else if (req.query.branch) {
      filter.branch = req.query.branch;
    }

    const periods = await OHADAAccountingPeriod.find(filter)
      .populate('createdBy', 'name')
      .populate('closedBy', 'name')
      .sort({ year: -1 });

    res.json({ data: periods });
  } catch (err: any) {
    console.error('GET /api/ohada/periods error', err);
    res.status(500).json({ error: { message: 'Failed to fetch accounting periods' } });
  }
});

// Create accounting period
router.post('/periods', authMiddleware, requirePermission('accounting'), async (req: AuthRequest, res) => {
  try {
    const { year } = req.body;
    
    if (!year) {
      return res.status(400).json({ error: { message: 'Year is required' } });
    }

    const branchId = req.user?.isSuperAdmin ? req.body.branch : req.user?.branch;
    if (!branchId) {
      return res.status(400).json({ error: { message: 'Branch is required' } });
    }

    // Check if period already exists
    const existing = await OHADAAccountingPeriod.findOne({ year, branch: branchId });
    if (existing) {
      return res.status(400).json({ error: { message: 'Accounting period already exists for this year' } });
    }

    const period = new OHADAAccountingPeriod({
      year,
      startDate: new Date(year, 0, 1), // January 1st
      endDate: new Date(year, 11, 31), // December 31st
      branch: branchId,
      createdBy: req.user?.id,
      openingBalances: []
    });

    await period.save();

    const populatedPeriod = await OHADAAccountingPeriod.findById(period._id)
      .populate('createdBy', 'name');

    res.status(201).json({ data: populatedPeriod });
  } catch (err: any) {
    console.error('POST /api/ohada/periods error', err);
    res.status(500).json({ error: { message: 'Failed to create accounting period' } });
  }
});

export default router;