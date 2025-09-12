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
      accounts.push({
        code: classCode,
        name: classData.name,
        level: 1,
        isActive: true,
        createdBy: req.user?.id
      });

      // Create individual accounts (level 2-4)
      for (const [accountCode, accountName] of Object.entries(classData.accounts)) {
        accounts.push({
          code: accountCode,
          name: accountName,
          level: accountCode.length,
          parentCode: accountCode.length > 1 ? accountCode.substring(0, accountCode.length - 1) : classCode,
          isActive: true,
          createdBy: req.user?.id
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
    const { code, name, description, parentCode } = req.body;
    
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

    const account = new OHADAAccount({
      code,
      name,
      description,
      parentCode,
      level: code.length,
      createdBy: req.user?.id,
      branch: req.user?.isSuperAdmin ? req.body.branch : req.user?.branch
    });

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

    // Validate that debits equal credits
    const totalDebits = lines.reduce((sum: number, line: any) => sum + (line.debit || 0), 0);
    const totalCredits = lines.reduce((sum: number, line: any) => sum + (line.credit || 0), 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return res.status(400).json({ error: { message: 'Debits must equal credits' } });
    }

    // Validate accounts exist
    const accountIds = lines.map((line: any) => line.account);
    const accounts = await OHADAAccount.find({ _id: { $in: accountIds } });
    
    if (accounts.length !== accountIds.length) {
      return res.status(400).json({ error: { message: 'One or more accounts not found' } });
    }

    // Enrich lines with account information
    const enrichedLines = lines.map((line: any) => {
      const account = accounts.find(acc => acc._id.toString() === line.account);
      return {
        ...line,
        accountCode: account?.code,
        accountName: account?.name
      };
    });

    const entry = new OHADAJournalEntry({
      date: new Date(date),
      reference,
      description,
      lines: enrichedLines,
      createdBy: req.user?.id,
      branch: req.user?.isSuperAdmin ? req.body.branch : req.user?.branch
    });

    await entry.save();

    const populatedEntry = await OHADAJournalEntry.findById(entry._id)
      .populate('createdBy', 'name')
      .populate('lines.account', 'code name');

    try {
      emitEvent(entry.branch.toString(), 'ohada.journal.created', { entry: populatedEntry });
    } catch (e) {}

    res.status(201).json({ data: populatedEntry });
  } catch (err: any) {
    console.error('POST /api/ohada/journal error', err);
    res.status(500).json({ error: { message: 'Failed to create journal entry' } });
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
    const { reportType } = req.params;
    const { period, format = 'excel', branch } = req.query;

    if (!period) {
      return res.status(400).json({ error: { message: 'Period is required' } });
    }

    // Get report data
    let reportData: any;
    switch (reportType) {
      case 'trial_balance':
        const tbRes = await fetch(`${req.protocol}://${req.get('host')}/api/ohada/reports/trial-balance?period=${period}&branch=${branch || ''}`);
        reportData = await tbRes.json();
        break;
      case 'balance_sheet':
        const bsRes = await fetch(`${req.protocol}://${req.get('host')}/api/ohada/reports/balance-sheet?period=${period}&branch=${branch || ''}`);
        reportData = await bsRes.json();
        break;
      case 'income_statement':
        const isRes = await fetch(`${req.protocol}://${req.get('host')}/api/ohada/reports/income-statement?period=${period}&branch=${branch || ''}`);
        reportData = await isRes.json();
        break;
      default:
        return res.status(400).json({ error: { message: 'Invalid report type' } });
    }

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(reportType.replace('_', ' ').toUpperCase());

      // Add title
      worksheet.mergeCells('A1:F1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = `OHADA ${reportType.replace('_', ' ').toUpperCase()} - Period: ${period}`;
      titleCell.font = { size: 16, bold: true };
      titleCell.alignment = { horizontal: 'center' };

      // Add headers and data based on report type
      if (reportType === 'trial_balance') {
        const headers = ['Account Code', 'Account Name', 'Opening Debit', 'Opening Credit', 'Period Debit', 'Period Credit', 'Closing Debit', 'Closing Credit'];
        worksheet.addRow(headers);
        
        const headerRow = worksheet.getRow(3);
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
      }

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        column.width = 15;
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="ohada-${reportType}-${period}.xlsx"`);
      
      await workbook.xlsx.write(res);
      res.end();
    } else if (format === 'pdf') {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="ohada-${reportType}-${period}.pdf"`);
      
      doc.pipe(res);
      
      // Add title
      doc.fontSize(18).text(`OHADA ${reportType.replace('_', ' ').toUpperCase()}`, { align: 'center' });
      doc.fontSize(12).text(`Period: ${period}`, { align: 'center' });
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