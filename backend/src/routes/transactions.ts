import express from 'express';
import Transaction from '../models/Transaction';
import { requirePermission } from '../middleware/auth';
import { expenseCategories, incomeCategories } from '../data/accountingCategories';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
// json2csv doesn't ship types; require at runtime and treat as any
// @ts-ignore
const { Parser: Json2csvParser } = require('json2csv');

const upload = multer({ dest: path.join(__dirname, '../../tmp') });

const router = express.Router();

const allAllowedCategories = new Set([...expenseCategories.map(c => c.toLowerCase()), ...incomeCategories.map(c => c.toLowerCase())]);

// Helper to build filter from query
function buildFilter(query: any) {
  const { type, from, to, category } = query;
  const filter: any = {};
  if (type && (type === 'income' || type === 'expense')) filter.type = type;
  if (category) filter.category = category;
  if (from || to) filter.date = {};
  if (from) filter.date.$gte = new Date(from);
  if (to) filter.date.$lte = new Date(to);
  return filter;
}

// GET /api/transactions?page=1&limit=20&type=income&from=...&to=...
router.get('/', async (req, res) => {
  try {
    const { page = '1', limit = '100' } = req.query as any;
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(1000, Math.max(1, parseInt(limit, 10) || 100));

    const filter = buildFilter(req.query);

    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip((p - 1) * l)
      .limit(l)
      .populate('staffId', 'name email')
      .populate('studentId', 'name email');

    res.json({ data: transactions, meta: { total, page: p, limit: l } });
  } catch (err) {
    console.error('GET /api/transactions error', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// CSV export: GET /api/transactions/export?type=...&from=...&to=...
router.get('/export', async (req, res) => {
  try {
    const filter = buildFilter(req.query);
    const rows = await Transaction.find(filter).sort({ date: -1, createdAt: -1 });

    const format = String(req.query.format || 'csv').toLowerCase();
    // Map rows to simple objects
    const mapped = rows.map((r: any) => ({
      _id: r._id?.toString(),
      type: r.type,
      category: r.category,
      amount: r.amount,
      description: r.description,
      date: r.date ? new Date(r.date).toISOString() : '',
      reference: r.reference,
      createdBy: r.createdBy,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : '',
      staffName: r.staffId ? (r.staffId.name || '') : '',
      staffEmail: r.staffId ? (r.staffId.email || '') : '',
      studentName: r.studentId ? (r.studentId.name || '') : '',
      studentEmail: r.studentId ? (r.studentId.email || '') : ''
    }));

    if (format === 'csv') {
  const fields = ['_id', 'type', 'category', 'amount', 'description', 'date', 'reference', 'createdBy', 'createdAt', 'staffName', 'staffEmail', 'studentName', 'studentEmail'];
      const json2csv = new Json2csvParser({ fields });
      const csv = json2csv.parse(mapped);
      res.header('Content-Type', 'text/csv');
      res.attachment('transactions.csv');
      return res.send(csv);
    }

    if (format === 'xlsx' || format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Transactions');
      sheet.columns = [
        { header: 'ID', key: '_id', width: 24 },
        { header: 'Type', key: 'type', width: 12 },
        { header: 'Category', key: 'category', width: 30 },
        { header: 'Amount', key: 'amount', width: 12 },
        { header: 'Description', key: 'description', width: 40 },
        { header: 'Date', key: 'date', width: 24 },
        { header: 'Reference', key: 'reference', width: 24 },
        { header: 'Created By', key: 'createdBy', width: 24 },
        { header: 'Created At', key: 'createdAt', width: 24 },
        { header: 'Staff', key: 'staffName', width: 24 },
        { header: 'Staff Email', key: 'staffEmail', width: 32 },
        { header: 'Student', key: 'studentName', width: 24 },
        { header: 'Student Email', key: 'studentEmail', width: 32 }
      ];
  mapped.forEach((m: any) => sheet.addRow(m));
      res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.attachment('transactions.xlsx');
      await workbook.xlsx.write(res);
      return res.end();
    }

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      res.header('Content-Type', 'application/pdf');
      res.attachment('transactions.pdf');
      doc.pipe(res);
      doc.fontSize(16).text('Transactions Report', { align: 'center' });
      doc.moveDown();
      mapped.forEach((m: any) => {
        const who = m.staffName ? `Staff: ${m.staffName}` : (m.studentName ? `Student: ${m.studentName}` : '');
        doc.fontSize(10).text(`${m.date} | ${m.type.toUpperCase()} | ${m.category} | ${m.amount} XAF ${who ? `| ${who}` : ''}`);
        doc.fontSize(9).text(`${m.description}`);
        doc.moveDown(0.3);
      });
      doc.end();
      return;
    }

    if (format === 'doc' || format === 'word') {
      // Simple HTML-based Word document
      const html = [`<html><head><meta charset="utf-8"></head><body><h1>Transactions</h1><table border="1" cellspacing="0" cellpadding="4"><thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Amount</th><th>Description</th></tr></thead><tbody>`];
      mapped.forEach((m: any) => {
        html.push(`<tr><td>${m.date}</td><td>${m.type}</td><td>${m.category}</td><td>${m.amount} XAF</td><td>${m.description}</td></tr>`);
      });
      html.push('</tbody></table></body></html>');
      res.header('Content-Type', 'application/msword');
      res.attachment('transactions.doc');
      return res.send(html.join(''));
    }

    // Email option: send CSV attachment to email address
    if (format === 'email') {
      const to = String(req.query.email || '');
      if (!to) return res.status(400).json({ error: 'Missing email address' });
      // Create CSV attachment
  const fields = ['_id', 'type', 'category', 'amount', 'description', 'date', 'reference', 'createdBy', 'createdAt', 'staffName', 'staffEmail', 'studentName', 'studentEmail'];
      const json2csv = new Json2csvParser({ fields });
      const csv = json2csv.parse(mapped);

      // Configure transporter via env vars
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Boolean(process.env.SMTP_SECURE === 'true'),
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
      });

      // verify
      try {
        await transporter.verify();
      } catch (err) {
        console.error('SMTP verify failed', err);
        return res.status(500).json({ error: 'Email service not configured' });
      }

      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@unhimas.local',
        to,
        subject: 'Transactions Export',
        text: 'Attached is the transactions export.',
        attachments: [{ filename: 'transactions.csv', content: csv }]
      });

      return res.json({ ok: true });
    }

    return res.status(400).json({ error: 'Unsupported format' });
  } catch (err) {
    console.error('GET /api/transactions/export error', err);
    res.status(500).json({ error: 'Failed to export transactions' });
  }
});

// Import endpoint: accept CSV/XLSX file and create transactions
router.post('/import', requirePermission('accounting'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Missing file' });
    const ext = path.extname(req.file.originalname || '').toLowerCase();
    const filePath = req.file.path;
    const created: any[] = [];
    const errors: any[] = [];

    const processRow = async (rowObj: any, lineNumber: number) => {
      try {
        const type = String(rowObj.type || '').toLowerCase();
        const category = rowObj.category;
        const amount = Number(rowObj.amount || 0);
        const description = rowObj.description || '';
        const date = rowObj.date ? new Date(rowObj.date) : new Date();

        if (!type || !(type === 'income' || type === 'expense')) {
          throw new Error('Invalid or missing type (must be "income" or "expense")');
        }
        if (!category) throw new Error('Missing category');
        if (isNaN(amount) || amount <= 0) throw new Error('Invalid amount');

        // basic category validation against known categories
        if (!allAllowedCategories.has(String(category).toLowerCase())) {
          throw new Error(`Unknown category: ${category}`);
        }

        const trx = new Transaction({ type, category, amount, description, date, staffId: rowObj.staffId || undefined, studentId: rowObj.studentId || undefined });
        await trx.save();
        created.push(trx);
      } catch (e: any) {
        errors.push({ line: lineNumber, error: e.message || String(e) });
      }
    };

    if (ext === '.csv') {
      const csv = fs.readFileSync(filePath, 'utf8');
      const lines = csv.split(/\r?\n/).filter(Boolean);
      const headers = lines.shift()!.split(',').map(h => h.trim());
      let lnNo = 1;
      for (const ln of lines) {
        lnNo++;
        const cols = ln.split(',');
        const obj: any = {};
        headers.forEach((h, i) => obj[h] = cols[i]);
        await processRow(obj, lnNo);
      }
    } else {
      // try xlsx
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const sheet = workbook.worksheets[0];
      const rows = sheet.getSheetValues();
      const headers = (rows[1] as any).slice(1).map((h: any) => String(h).trim());
      for (let i = 2; i <= sheet.rowCount; i++) {
        const row = sheet.getRow(i).values as any[];
        if (!row || row.length === 0) continue;
        const obj: any = {};
        headers.forEach((h: any, idx: number) => obj[h] = row[idx+1]);
        await processRow(obj, i);
      }
    }

    // cleanup tmp file
    try { fs.unlinkSync(filePath); } catch {};

    const result: any = { created: created.length };
    if (errors.length > 0) result.errors = errors;
    res.json(result);
  } catch (err) {
    console.error('POST /api/transactions/import error', err);
    res.status(500).json({ error: 'Failed to import transactions' });
  }
});

// Update transaction
router.put('/:id', requirePermission('accounting'), async (req, res) => {
  try {
    const id = req.params.id;
    const update = req.body;
    if (update.category && !allAllowedCategories.has(String(update.category).toLowerCase())) {
      return res.status(400).json({ error: 'Invalid category' });
    }
  const trx = await Transaction.findByIdAndUpdate(id, update, { new: true }).populate('staffId', 'name email').populate('studentId', 'name email');
    if (!trx) return res.status(404).json({ error: 'Transaction not found' });
    res.json(trx);
  } catch (err) {
    console.error('PUT /api/transactions/:id error', err);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Delete transaction
router.delete('/:id', requirePermission('accounting'), async (req, res) => {
  try {
    const id = req.params.id;
    const trx = await Transaction.findByIdAndDelete(id);
    if (!trx) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/transactions/:id error', err);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// GET /api/transactions/:id
router.get('/:id', async (req, res) => {
  try {
  const trx = await Transaction.findById(req.params.id).populate('staffId', 'name email').populate('studentId', 'name email');
    if (!trx) return res.status(404).json({ error: 'Transaction not found' });
    res.json(trx);
  } catch (err) {
    console.error('GET /api/transactions/:id error', err);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// Summary endpoint: GET /api/transactions/summary?from=...&to=...&type=income|expense
router.get('/summary', async (req, res) => {
  try {
    const filter = buildFilter(req.query);
    const groupBy = String(req.query.groupBy || '').toLowerCase();

    // Simple in-memory cache to avoid repeated heavy aggregations
    // key is the serialized query params. TTL: 30 seconds
    const cacheKey = JSON.stringify({ filter, groupBy });
    // lightweight cache store on module
    if (!(global as any).__trxSummaryCache) {
      (global as any).__trxSummaryCache = new Map<string, { expires: number; data: any }>();
    }
    const cache: Map<string, { expires: number; data: any }> = (global as any).__trxSummaryCache;
    const now = Date.now();
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > now) {
      return res.json({ data: cached.data });
    }

    if (groupBy === 'month') {
      // group by year-month
      const agg = await Transaction.aggregate([
        { $match: filter },
        { $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          totalIncome: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, { $ifNull: ['$amount', 0] }, 0] } },
          totalExpense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, { $ifNull: ['$amount', 0] }, 0] } },
          count: { $sum: 1 }
        } },
        { $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          totalIncome: 1,
          totalExpense: 1,
          count: 1,
          net: { $subtract: ['$totalIncome', '$totalExpense'] }
        } },
        { $sort: { year: 1, month: 1 } }
      ]).exec();

      // map labels
      const out = agg.map((r: any) => ({ label: `${r.year}-${String(r.month).padStart(2, '0')}`, year: r.year, month: r.month, totalIncome: r.totalIncome || 0, totalExpense: r.totalExpense || 0, count: r.count || 0, net: (r.totalIncome || 0) - (r.totalExpense || 0) }));
      cache.set(cacheKey, { expires: now + 30_000, data: out });
      return res.json({ data: out });
    }

    // default: totals
    const agg = await Transaction.aggregate([
      { $match: filter },
      { $group: {
        _id: null,
        totalIncome: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, { $ifNull: ['$amount', 0] }, 0] } },
        totalExpense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, { $ifNull: ['$amount', 0] }, 0] } },
        count: { $sum: 1 }
      } }
    ]).exec();

    const summary = (agg && agg[0]) ? agg[0] : { totalIncome: 0, totalExpense: 0, count: 0 };
    const out = { totalIncome: summary.totalIncome || 0, totalExpense: summary.totalExpense || 0, count: summary.count || 0 };
    cache.set(cacheKey, { expires: now + 30_000, data: out });
    res.json({ data: out });
  } catch (err) {
    console.error('GET /api/transactions/summary error', err);
    res.status(500).json({ error: 'Failed to compute summary' });
  }
});

// Add a transaction
router.post('/', requirePermission('accounting'), async (req: any, res) => {
  try {
  const { type, category, amount, description, date, reference, createdBy, staffId, studentId } = req.body;
    if (!type || !category || !amount || !description || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // validate type
    if (!(type === 'income' || type === 'expense')) {
      return res.status(400).json({ error: 'Invalid type' });
    }

    // validate category against allowed list (case-insensitive)
    if (!allAllowedCategories.has(String(category).toLowerCase())) {
      return res.status(400).json({ error: 'Invalid category' });
    }

  // normalize date
  const postingDate = date ? new Date(date) : new Date();
  // prefer authenticated user info if present (req.user added by auth middleware when using JWT)
  const creator = req.user ? { id: req.user.id || null, name: (req.user as any).name || null, email: (req.user as any).email || null } : (createdBy || 'system');

  const transaction = new Transaction({ type, category, amount, description, date: postingDate, reference, createdBy: creator, staffId: staffId || undefined, studentId: studentId || undefined, createdAt: new Date() });
  await transaction.save();
  res.status(201).json(transaction);
  } catch (err) {
    console.error('POST /api/transactions error', err);
    res.status(400).json({ error: 'Failed to add transaction' });
  }
});

export default router;
