import express from 'express';
import { requirePermission } from '../middleware/auth';
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
router.get('/', requirePermission('accounting:view'), async (req, res) => {
    try {
        const { page = '1', limit = '20', from, to, branch } = req.query as any;
        const p = Math.max(1, parseInt(page, 10) || 1);
        const l = Math.min(1000, Math.max(1, parseInt(limit, 10) || 20));

        const filter: any = {};
        if (branch) filter.branch = branch;
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
router.get('/export', requirePermission('accounting:view'), async (req: any, res) => {
    try {
        const { format = 'csv' } = req.query;
        const entries = await JournalEntry.find().populate('createdBy', 'name').populate('lines.account', 'name');

        const flattened = entries.flatMap(entry =>
            entry.lines.map(line => ({
                date: entry.date,
                memo: entry.memo,
                status: entry.status,
                account: (line.account as any)?.name || 'N/A',
                debit: line.debit,
                credit: line.credit,
                createdBy: (entry.createdBy as any)?.name || 'N/A',
            }))
        );

        if (format === 'csv') {
            const json2csv = new Json2csvParser();
            const csv = json2csv.parse(flattened);
            res.header('Content-Type', 'text/csv');
            res.attachment('journal_entries.csv');
            return res.send(csv);
        }

        if (format === 'xlsx') {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Journal Entries');
            sheet.columns = [
                { header: 'Date', key: 'date', width: 20 },
                { header: 'Memo', key: 'memo', width: 40 },
                { header: 'Status', key: 'status', width: 15 },
                { header: 'Account', key: 'account', width: 30 },
                { header: 'Debit', key: 'debit', width: 15 },
                { header: 'Credit', key: 'credit', width: 15 },
                { header: 'Created By', key: 'createdBy', width: 30 },
            ];
            sheet.addRows(flattened);
            res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.attachment('journal_entries.xlsx');
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
router.get('/summary', requirePermission('accounting:view'), async (req: any, res) => {
    try {
        const { from, to, branch } = req.query;
        const filter: any = { status: 'approved' }; // Only include approved transactions in summary
        if (from) filter.date = { ...filter.date, $gte: new Date(from as string) };
        if (to) filter.date = { ...filter.date, $lte: new Date(to as string) };
        if (branch) filter.branch = branch;

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
router.get('/summary/trends', requirePermission('accounting:view'), async (req: any, res) => {
    try {
        const { branch } = req.query;
        const now = new Date();
        const results: { month: string; label: string; income: number; expense: number; net: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthStart = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
            const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
            const monthKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;
            const label = monthStart.toLocaleString('en-US', { month: 'short' });

            const filter: any = { status: 'approved', date: { $gte: monthStart, $lte: monthEnd } };
            if (branch) filter.branch = branch;
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
            results.push({ month: monthKey, label, income, expense, net: income - expense });
        }

        res.json({ data: { months: results } });
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
