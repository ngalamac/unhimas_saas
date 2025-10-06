import express from 'express';
import authMiddleware, { requirePermission, requireBranchAccess, AuthRequest } from '../middleware/auth';
import { expenseCategories, incomeCategories } from '../data/accountingCategories';
import ExcelJS from 'exceljs';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import JournalEntry from '../models/JournalEntry';
import Account from '../models/Account';
import { recordGenericTransaction, recordJournalEntry } from '../services/accountingService';

// @ts-ignore
const { Parser: Json2csvParser } = require('json2csv');

const upload = multer({ dest: path.join(__dirname, '../../tmp') });

const router = express.Router();

const allAllowedCategories = new Set([...expenseCategories.map(c => c.toLowerCase()), ...incomeCategories.map(c => c.toLowerCase())]);

// GET /api/transactions - List all journal entries with pagination
router.get('/', authMiddleware, requireBranchAccess(), requirePermission('accounting:view'), async (req: AuthRequest, res) => {
    try {
        const { page = '1', limit = '20', from, to, branch } = req.query as any;
        const p = Math.max(1, parseInt(page, 10) || 1);
        const l = Math.min(1000, Math.max(1, parseInt(limit, 10) || 20));

        const filter: any = {};
        if (!req.user?.isSuperAdmin && req.user?.branch) filter.branch = req.user.branch; else if (branch) filter.branch = branch;
        if (from || to) filter.date = {};
        if (from) filter.date.$gte = new Date(from);
        if (to) filter.date.$lte = new Date(to);

        const total = await JournalEntry.countDocuments(filter);
        const entries = await JournalEntry.find(filter)
            .sort({ date: -1, createdAt: -1 })
            .skip((p - 1) * l)
            .limit(l)
            .populate('createdBy', 'name email')
            .populate('approvedBy', 'name email')
            .populate('lines.account', 'name type');

        res.json({ data: entries, meta: { total, page: p, limit: l } });
    } catch (err: any) {
        console.error('GET /api/transactions error', err);
        res.status(500).json({ error: { message: 'Failed to fetch journal entries', details: err.message } });
    }
});

// Export journal entries to CSV or XLSX
router.get('/export', authMiddleware, requireBranchAccess(), requirePermission('accounting:view'), async (req: any, res) => {
    try {
        const { format = 'csv', lang = 'en', from, to, branch, department, status } = req.query as any;

        const t = (key: string) => {
            const fr: Record<string,string> = {
                date: 'Date',
                memo: 'Libellé',
                status: 'Statut',
                account: 'Compte',
                debit: 'Débit',
                credit: 'Crédit',
                createdBy: 'Créé par',
                journalEntries: 'Écritures',
                approved: 'Approuvé',
                pending: 'En attente',
                rejected: 'Rejeté',
            };
            const en: Record<string,string> = {
                date: 'Date',
                memo: 'Memo',
                status: 'Status',
                account: 'Account',
                debit: 'Debit',
                credit: 'Credit',
                createdBy: 'Created By',
                journalEntries: 'Journal Entries',
                approved: 'approved',
                pending: 'pending',
                rejected: 'rejected',
            };
            return (String(lang).toLowerCase() === 'fr' ? fr : en)[key] || key;
        };

        const translateStatus = (s: string) => {
            const map: any = { approved: t('approved'), pending: t('pending'), rejected: t('rejected') };
            return map[String(s).toLowerCase()] || s;
        };

        const formatDate = (d: any) => {
            try { return new Date(d).toLocaleDateString(String(lang).toLowerCase() === 'fr' ? 'fr-FR' : 'en-US'); } catch { return String(d); }
        };

        const filter: any = {};
        if (!req.user?.isSuperAdmin && req.user?.branch) filter.branch = req.user.branch; else if (branch) filter.branch = branch;
        if (department) filter.department = department;
        if (status) filter.status = status;
        if (from || to) filter.date = {};
        if (from) filter.date.$gte = new Date(from);
        if (to) filter.date.$lte = new Date(to);

        const entries = await JournalEntry.find(filter)
          .sort({ date: -1, createdAt: -1 })
          .populate('createdBy', 'name')
          .populate('lines.account', 'name');

        const flattened = entries.flatMap(entry =>
            entry.lines.map(line => ({
                date: formatDate(entry.date),
                memo: entry.memo,
                status: translateStatus(entry.status),
                account: (line.account as any)?.name || 'N/A',
                debit: line.debit,
                credit: line.credit,
                createdBy: (entry.createdBy as any)?.name || 'N/A',
            }))
        );

        if (format === 'csv') {
            const fields = [
              { label: t('date'), value: 'date' },
              { label: t('memo'), value: 'memo' },
              { label: t('status'), value: 'status' },
              { label: t('account'), value: 'account' },
              { label: t('debit'), value: 'debit' },
              { label: t('credit'), value: 'credit' },
              { label: t('createdBy'), value: 'createdBy' },
            ];
            const json2csv = new Json2csvParser({ fields });
            const csv = json2csv.parse(flattened);
            res.header('Content-Type', 'text/csv; charset=utf-8');
            res.attachment(`${t('journalEntries').toLowerCase().replace(/\s+/g,'_')}_${lang}.csv`);
            return res.send('\uFEFF' + csv); // prepend BOM for Excel UTF-8 support
        }

        if (format === 'xlsx') {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet(t('journalEntries'));
            sheet.columns = [
                { header: t('date'), key: 'date', width: 20 },
                { header: t('memo'), key: 'memo', width: 40 },
                { header: t('status'), key: 'status', width: 15 },
                { header: t('account'), key: 'account', width: 30 },
                { header: t('debit'), key: 'debit', width: 15 },
                { header: t('credit'), key: 'credit', width: 15 },
                { header: t('createdBy'), key: 'createdBy', width: 30 },
            ];
            sheet.addRows(flattened);
            res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.attachment(`${t('journalEntries').toLowerCase().replace(/\s+/g,'_')}_${lang}.xlsx`);
            await workbook.xlsx.write(res);
            return res.end();
        }

        return res.status(400).json({ error: { message: 'Unsupported format' } });

    } catch (err: any) {
        console.error('GET /api/transactions/export error', err);
        res.status(500).json({ error: { message: 'Failed to export transactions', details: err.message } });
    }
});

// Import journal entries from a CSV file
router.post('/import', requirePermission('accounting:create'), upload.single('file'), async (req: any, res) => {
    if (!req.file) {
        return res.status(400).json({ error: { message: 'No file uploaded' } });
    }

    try {
        const entriesData = new Map<string, { date: Date, lines: any[] }>();
        const csv = fs.readFileSync(req.file.path, 'utf8');
        // Assumes CSV format: Date,Memo,Account,Debit,Credit
        const lines = csv.split(/\r?\n/).slice(1); // skip header

        for (const line of lines) {
            const [date, memo, account, debit, credit] = line.split(',');
            if (!memo || !account || (!debit && !credit)) continue;

            const entryKey = `${memo}_${date}`;
            if (!entriesData.has(entryKey)) {
                entriesData.set(entryKey, { date: new Date(date), lines: [] });
            }
            entriesData.get(entryKey)!.lines.push({ accountName: account, debit: parseFloat(debit || '0'), credit: parseFloat(credit || '0') });
        }

        const createdEntries = [];
        for (const [memo, data] of entriesData) {
            const { date, lines } = data;

            const journalLines = await Promise.all(lines.map(async (line) => {
                const accountDoc = await Account.findOne({ name: line.accountName });
                if (!accountDoc) throw new Error(`Account not found: ${line.accountName}`);
                return {
                    account: accountDoc._id,
                    debit: line.debit,
                    credit: line.credit,
                };
            }));

            // Validate that the entry is balanced
            const totalDebits = journalLines.reduce((sum, l) => sum + l.debit, 0);
            const totalCredits = journalLines.reduce((sum, l) => sum + l.credit, 0);
            if (Math.abs(totalDebits - totalCredits) > 0.001) { // Use a small tolerance for float comparison
                console.warn(`Skipping unbalanced journal entry during import: ${memo}`);
                continue;
            }

            const newEntry = await recordJournalEntry({
                branch: req.user.branch,
                createdBy: req.user.id,
                memo,
                date,
                lines: journalLines,
            });
            createdEntries.push(newEntry);
        }

        res.json({ data: { message: `${createdEntries.length} journal entries imported successfully` } });

    } catch (err: any) {
        res.status(500).json({ error: { message: 'Failed to import transactions', details: err.message } });
    } finally {
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
    }
});

// Update a journal entry (only memo and date can be updated)
router.put('/:id', requirePermission('accounting:edit'), async (req: any, res) => {
    try {
        const { memo, date } = req.body;
        const entry = await JournalEntry.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ error: { message: 'Journal entry not found' } });
        }
        // For now, only allow editing of 'pending' transactions
        if (entry.status !== 'pending') {
            return res.status(400).json({ error: { message: `Only pending entries can be edited. This entry is already ${entry.status}` } });
        }

        if (memo) entry.memo = memo;
        if (date) entry.date = new Date(date);

        await entry.save();
        res.json({ data: entry });

    } catch (err: any) {
        console.error('PUT /api/transactions/:id error', err);
        res.status(500).json({ error: { message: 'Failed to update transaction', details: err.message } });
    }
});

// Delete a journal entry (only if pending)
router.delete('/:id', requirePermission('accounting:delete'), async (req: any, res) => {
    try {
        const entry = await JournalEntry.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ error: { message: 'Journal entry not found' } });
        }

        if (entry.status !== 'pending') {
            return res.status(400).json({ error: { message: `Only pending transactions can be deleted. This transaction is already ${entry.status}` } });
        }

        await JournalEntry.findByIdAndDelete(req.params.id);
        res.json({ data: { message: 'Transaction deleted successfully' } });

    } catch (err: any) {
        console.error('DELETE /api/transactions/:id error', err);
        res.status(500).json({ error: { message: 'Failed to delete transaction', details: err.message } });
    }
});

// GET /api/transactions/:id - Get a single journal entry
router.get('/:id', requirePermission('accounting:view'), async (req, res) => {
    try {
        const entry = await JournalEntry.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('approvedBy', 'name email')
            .populate('lines.account', 'name type');
        if (!entry) return res.status(404).json({ error: { message: 'Journal entry not found' } });
        res.json({ data: entry });
    } catch (err: any) {
        console.error('GET /api/transactions/:id error', err);
        res.status(500).json({ error: { message: 'Failed to fetch journal entry', details: err.message } });
    }
});

// Approve a journal entry
router.post('/:id/approve', requirePermission('accounting:approve'), async (req: any, res) => {
    try {
        const entry = await JournalEntry.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ error: { message: 'Journal entry not found' } });
        }

        if (entry.status !== 'pending') {
            return res.status(400).json({ error: { message: `Only pending transactions can be approved. This transaction is already ${entry.status}` } });
        }

        entry.status = 'approved';
        entry.approvedBy = req.user.id;
        await entry.save();

        res.json({ data: entry });
    } catch (err: any) {
        console.error('POST /api/transactions/:id/approve error', err);
        res.status(500).json({ error: { message: 'Failed to approve transaction', details: err.message } });
    }
});

// Reject a journal entry
router.post('/:id/reject', requirePermission('accounting:approve'), async (req: any, res) => {
    try {
        const { reason } = req.body;
        if (!reason) {
            return res.status(400).json({ error: { message: 'Rejection reason is required' } });
        }

        const entry = await JournalEntry.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ error: { message: 'Journal entry not found' } });
        }

        if (entry.status !== 'pending') {
            return res.status(400).json({ error: { message: `Only pending transactions can be rejected. This transaction is already ${entry.status}` } });
        }

        entry.status = 'rejected';
        entry.rejectionReason = reason;
        await entry.save();

        res.json({ data: entry });
    } catch (err: any) {
        console.error('POST /api/transactions/:id/reject error', err);
        res.status(500).json({ error: { message: 'Failed to reject transaction', details: err.message } });
    }
});

// GET /api/transactions/summary - Financial summary
router.get('/summary', authMiddleware, requireBranchAccess(), requirePermission('accounting:view'), async (req: any, res) => {
    try {
        const { from, to, branch, department } = req.query as any;
        const filter: any = { status: 'approved' }; // Only include approved transactions in summary
        if (from) filter.date = { ...filter.date, $gte: new Date(from as string) };
        if (to) filter.date = { ...filter.date, $lte: new Date(to as string) };
        if (branch) filter.branch = branch;
        if (department) filter.department = department;

        const entries = await JournalEntry.find(filter).populate('lines.account');

        let totalIncome = 0;
        let totalExpense = 0;

        for (const entry of entries) {
            for (const line of entry.lines) {
                const account = line.account as any;
                if (account) {
                    // Based on standard accounting: Income accounts increase with credits. Expense accounts increase with debits.
                    if (account.type === 'income') {
                        totalIncome += line.credit;
                    } else if (account.type === 'expense') {
                        totalExpense += line.debit;
                    }
                }
            }
        }

        res.json({ data: { totalIncome, totalExpense, net: totalIncome - totalExpense } });

    } catch (err: any) {
        console.error('GET /api/transactions/summary error', err);
        res.status(500).json({ error: { message: 'Failed to compute summary', details: err.message } });
    }
});

// GET /api/transactions/summary/trends - Monthly income vs expense (last 6 months)
router.get('/summary/trends', authMiddleware, requireBranchAccess(), requirePermission('accounting:view'), async (req: any, res) => {
    try {
        const { branch, department, period = 'month' } = req.query as any;
        const now = new Date();
        const results: Array<{ key: string; label: string; income: number; expense: number; net: number }>[] = [] as any;
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            // compute bucket start/end according to period
            const start = period === 'day' ? new Date(d.getFullYear(), d.getMonth(), now.getDate() - i) : new Date(d.getFullYear(), d.getMonth(), 1);
            const end = period === 'day' ? new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1, 0, 0, 0, 0) : new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
            const key = period === 'day' ? start.toISOString().slice(0,10) : `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
            const label = period === 'day' ? key : start.toLocaleString('en-US', { month: 'short' });

            const filter: any = { status: 'approved', date: { $gte: start, $lte: end } };
            if (req.user && !req.user.isSuperAdmin && req.user.branch) filter.branch = req.user.branch; else if (branch) filter.branch = branch;
            if (department) filter.department = department;
            const entries = await JournalEntry.find(filter).populate('lines.account');
            let income = 0;
            let expense = 0;
            for (const entry of entries) {
                for (const line of entry.lines) {
                    const account = (line as any).account;
                    if (account) {
                        if (account.type === 'income') income += line.credit;
                        else if (account.type === 'expense') expense += line.debit;
                    }
                }
            }
            results.push({ key, label, income, expense, net: income - expense } as any);
        }

        res.json({ data: { buckets: results, period } });
    } catch (err: any) {
        console.error('GET /api/transactions/summary/trends error', err);
        res.status(500).json({ error: { message: 'Failed to compute trends', details: err.message } });
    }
});

// POST /api/transactions - Create a simple transaction (e.g., from a form)
router.post('/', requirePermission('accounting:create'), async (req: any, res) => {
    try {
        const { type, category, amount, description, date, currency } = req.body;
        if (!type || !category || !amount || !description || !date) {
            return res.status(400).json({ error: { message: 'Missing required fields' } });
        }

        if (type !== 'income' && type !== 'expense') {
            return res.status(400).json({ error: { message: 'Invalid type' } });
        }

        if (!allAllowedCategories.has(String(category).toLowerCase())) {
            return res.status(400).json({ error: { message: 'Invalid category' } });
        }

        const journalEntry = await recordGenericTransaction(
            req.user.branch,
            req.user.id,
            type,
            category,
            amount,
            description,
            new Date(date),
            currency || 'XAF'
        );

        res.status(201).json({ data: journalEntry });
    } catch (err: any) {
        console.error('POST /api/transactions error', err);
        res.status(400).json({ error: { message: 'Failed to add transaction', details: err.message } });
    }
});

export default router;
