import express from 'express';
import OfficeTransaction from '../models/OfficeTransaction';
import Category from '../models/Category';
import { requirePermission, authMiddleware, requireBranchAccess, AuthRequest } from '../middleware/auth';
import BranchModel from '../models/BranchModel';
import mongoose from 'mongoose';
import { emitEvent } from '../lib/events';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

// helper to safely build regex from a string
function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
}

const router = express.Router();

// List transactions with filters, pagination
router.get('/', authMiddleware, requireBranchAccess(), requirePermission('accounting'), async (req: AuthRequest, res) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1'));
    const limit = Math.max(10, parseInt((req.query.limit as string) || '20'));
    const skip = (page - 1) * limit;
    const filter: any = {};

    // Branch filtering - SuperAdmin can see all, others only their branch
    if (!req.user?.isSuperAdmin && req.user?.branch) {
      filter.branch = req.user.branch;
    } else if (req.query.branch) {
      filter.branch = req.query.branch;
    }

    if (req.query.type) filter.type = req.query.type;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.user) filter.registeredBy = req.query.user;
    if (req.query.student) filter.linkedStudent = req.query.student;
    if (req.query.staff) filter.linkedStaff = req.query.staff;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = new Date(req.query.from as string);
      if (req.query.to) filter.date.$lte = new Date(req.query.to as string);
    }

    const total = await OfficeTransaction.countDocuments(filter);
    const docs = await OfficeTransaction.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate('registeredBy', 'name email')
      .populate('branch', 'name')
      .populate('linkedStudent', 'firstName lastName studentId')
      .populate('linkedStaff', 'firstName lastName employeeId')
      .lean();

    res.json({ data: docs, meta: { total, page, limit } });
  } catch (err) {
    console.error('GET /api/accounting error', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Create transaction
router.post('/', authMiddleware, requireBranchAccess(), requirePermission('accounting'), async (req: AuthRequest, res) => {
  try {
    const {
      type,
      category,
      categoryId,
      amount,
      date,
      linkedStudent,
      linkedStaff,
      description,
      reference,
      paymentMethod,
      attachments
    } = req.body;

    if (!type || (!(category || categoryId)) || !amount) {
      return res.status(400).json({ error: 'Missing required fields: type, category/categoryId, amount' });
    }

    // Diagnostic log for debugging frontend payload issues
    try { console.debug && console.debug('POST /api/accounting payload', { type, category, categoryId, amount }); } catch (e) {}

    // Resolve category: prefer categoryId (safer), fall back to name
    let cat: any = null;
    try {
      if (categoryId) {
        // Guard against synthetic or invalid ids coming from the client (e.g. fallback ids)
        if (mongoose.Types.ObjectId.isValid(String(categoryId))) {
          cat = await Category.findById(categoryId);
          if (!cat) return res.status(400).json({ error: 'Invalid category id' });
          if (cat.type !== type) return res.status(400).json({ error: 'Category type mismatch' });
        } else {
          // Not a valid ObjectId: fall back to resolving by category name (if provided)
          if (!category) return res.status(400).json({ error: 'Invalid category id and no category name provided' });
          cat = await Category.findOne({ name: category, type });
          if (!cat) return res.status(400).json({ error: 'Invalid category or category type mismatch' });
        }
      } else {
        // Verify category exists and matches type (exact match first)
        const requestedName = typeof category === 'string' ? category.trim() : category;
        cat = await Category.findOne({ name: requestedName, type });
        if (!cat && requestedName) {
          // Try case-insensitive trimmed match as a tolerant fallback
          try {
            cat = await Category.findOne({ type, name: { $regex: `^${escapeRegExp(requestedName)}$`, $options: 'i' } });
          } catch (reErr) {
            console.error('Regex category lookup error', reErr);
          }
        }
        if (!cat) {
          // If requestedName looks like a synthetic fallback (client-side), don't auto-create
          const isSynthetic = requestedName && String(requestedName).startsWith('fallback-');
          if (isSynthetic) {
            return res.status(400).json({ error: 'Invalid category or category type mismatch', provided: { category: requestedName, categoryId } });
          }

          // Auto-create category for convenience if user has permission — attach to branch if provided and user is not creating global categories
          try {
            const newCategory = await Category.create({
              name: requestedName,
              type,
              description: '',
              branch: req.user?.isSuperAdmin ? (req.body.branch || null) : (req.user?.branch || null),
              createdBy: req.user?.id
            });
            cat = newCategory;
          } catch (createErr) {
            console.error('Failed to auto-create category', createErr);
            return res.status(500).json({ error: 'Failed to create missing category' });
          }
        }
      }
    } catch (err) {
      console.error('Category resolution error', err);
      return res.status(500).json({ error: 'Category resolution failed' });
    }

    // Determine branch - use user's branch if not SuperAdmin
    let branchId = req.body.branch;
    if (!req.user?.isSuperAdmin) {
      branchId = req.user?.branch;
    }

    if (!branchId) {
      return res.status(400).json({ error: 'Branch is required' });
    }

    // Verify branch exists
    const branch = await BranchModel.findById(branchId);
    if (!branch) {
      return res.status(400).json({ error: 'Invalid branch' });
    }

    let tx: any = null;
    try {
      tx = await OfficeTransaction.create({
        type,
        // store the category name for reporting
        category: cat.name,
        categoryId: cat._id,
        amount: Number(amount),
        date: date ? new Date(date) : new Date(),
        registeredBy: req.user?.id,
        branch: branchId,
        linkedStudent: linkedStudent || undefined,
        linkedStaff: linkedStaff || undefined,
        description,
        reference,
        paymentMethod: paymentMethod || 'cash',
        attachments: attachments || [],
        status: 'approved' // Auto-approve for now, can be changed to 'pending' for approval workflow
      });
    } catch (err) {
      console.error('OfficeTransaction.create error', err);
      return res.status(500).json({ error: 'Failed to persist transaction' });
    }

    // Populate the response
    const populatedTx = await OfficeTransaction.findById(tx._id)
      .populate('registeredBy', 'name email')
      .populate('branch', 'name')
      .populate('linkedStudent', 'firstName lastName studentId')
      .populate('linkedStaff', 'firstName lastName employeeId');

    // Emit SSE so frontend can react in real-time
    try { emitEvent('accounting.transaction.created', { transaction: populatedTx }); } catch (e) {}

    res.status(201).json(populatedTx);
  } catch (err: any) {
    console.error('POST /api/accounting error', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err?.message || 'Failed to create transaction' });
  }
});

// Get single transaction (only match 24-hex ObjectId)
router.get('/:id([0-9a-fA-F]{24})', authMiddleware, requirePermission('accounting'), async (req, res) => {
  try {
    const tx = await OfficeTransaction.findById(req.params.id).populate('registeredBy', 'name email');
    if (!tx) return res.status(404).json({ error: 'Not found' });
    res.json(tx);
  } catch (err) {
    console.error('GET /api/accounting/:id error', err);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// Update
router.put('/:id([0-9a-fA-F]{24})', authMiddleware, requirePermission('accounting'), async (req, res) => {
  try {
    const updates: any = {};
    ['type', 'category', 'amount', 'date', 'linkedStudent', 'linkedStaff', 'description'].forEach(k => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });
    if (updates.category) {
      const cat = await Category.findOne({ name: updates.category });
      if (!cat || cat.type !== updates.type) return res.status(400).json({ error: 'Invalid category' });
    }
    const tx = await OfficeTransaction.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!tx) return res.status(404).json({ error: 'Not found' });
    res.json(tx);
  } catch (err) {
    console.error('PUT /api/accounting/:id error', err);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Delete
router.delete('/:id([0-9a-fA-F]{24})', authMiddleware, requirePermission('accounting'), async (req, res) => {
  try {
    const r = await OfficeTransaction.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/accounting/:id error', err);
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// Categories: list & create
router.get('/categories', authMiddleware, requireBranchAccess(), requirePermission('accounting'), async (req: AuthRequest, res) => {
  try {
    const filter: any = { isActive: true };

    // Branch filtering - show global categories and branch-specific ones
    if (!req.user?.isSuperAdmin && req.user?.branch) {
      filter.$or = [
        { branch: null }, // Global categories
        { branch: req.user.branch } // Branch-specific categories
      ];
    } else if (req.query.branch) {
      filter.$or = [
        { branch: null },
        { branch: req.query.branch }
      ];
    }

    let cats = await Category.find(filter).sort({ type: 1, name: 1 });

    if (!cats || cats.length === 0) {
      // Seed default categories
      const income = [
        'Registration fees','Tuition Fees','Examination fees','Internship fees','Cafeteria income','Donations, grants, and sponsorships','Rent of Campus','IT Boot camp','Miscellaneous'
      ];
      const expense = [
        'Payroll Expenses','Utilities','Publicity Expense','Examination expenses','Repairs & maintenance','Teaching materials','Laboratory supplies','Internship expense','Transport','Events & extracurricular activities','Administrative expenses','Miscellaneous'
      ];

      const inserts: any[] = [];
      income.forEach(n => inserts.push({
        name: n,
        type: 'income',
        createdBy: req.user?.id,
        branch: null // Global categories
      }));
      expense.forEach(n => inserts.push({
        name: n,
        type: 'expense',
        createdBy: req.user?.id,
        branch: null // Global categories
      }));

      await Category.insertMany(inserts);
      cats = await Category.find(filter).sort({ type: 1, name: 1 });
    }

    res.json(cats);
  } catch (err) {
    console.error('GET /api/accounting/categories error', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/categories', authMiddleware, requireBranchAccess(), requirePermission('accounting'), async (req: AuthRequest, res) => {
  try {
    const { name, type, description, branch } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'Missing fields: name and type are required' });

    // Determine branch for the category
    let branchId = branch;
    if (!req.user?.isSuperAdmin) {
      branchId = req.user?.branch; // Non-SuperAdmin users can only create branch-specific categories
    }

    // Check if category already exists for this branch/global
    const exists = await Category.findOne({
      name,
      type,
      branch: branchId || null
    });
    if (exists) return res.status(400).json({ error: 'Category already exists for this branch' });

    const c = await Category.create({
      name,
      type,
      description,
      branch: branchId || null,
      createdBy: req.user?.id
    });

    res.status(201).json(c);
  } catch (err) {
    console.error('POST /api/accounting/categories error', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Export endpoint (supports csv, excel, pdf, email)
router.get('/export', authMiddleware, requirePermission('accounting'), async (req: AuthRequest, res) => {
  try {
    const filter: any = {};
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = new Date(req.query.from as string);
      if (req.query.to) filter.date.$lte = new Date(req.query.to as string);
    }
    // Only set branch filter if it looks like a valid ObjectId to avoid cast errors
    if (req.query.branch && mongoose.Types.ObjectId.isValid(String(req.query.branch))) {
      filter.branch = req.query.branch;
    }

    const format = (req.query.format as string) || 'csv';

    const docs = await OfficeTransaction.find(filter).sort({ date: 1 }).populate('registeredBy', 'name email').lean();

    // Helper to safely stringify values for CSV output
    const safeString = (v: any) => {
      if (v === null || v === undefined) return '';
      if (typeof v === 'string') return v.replace(/"/g, '""');
      try { return String(v).replace(/"/g, '""'); } catch (e) { return '' + v; }
    };

    const safeDate = (d: any) => {
      if (!d) return '';
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return '';
      try { return dt.toISOString(); } catch (e) { return ''; }
    };

    // Build full transaction table: include branch, registeredBy, reference, paymentMethod, status, linkedStudent/Staff
    const header = ['Date','Type','Category','Description','Amount','Registered By','Branch','Reference','Payment Method','Status','Linked Student','Linked Staff'];

    const rows = docs.map(d => [
      safeDate(d.date),
      safeString(d.type),
      safeString(d.category),
      safeString(d.description),
      Number(d.amount) || 0,
      safeString((d.registeredBy as any)?.name),
      safeString((d.branch as any)?.name),
      safeString((d as any).reference),
      safeString((d as any).paymentMethod),
      safeString((d as any).status),
      safeString((d as any).linkedStudent ? ((d as any).linkedStudent.firstName ? ((d as any).linkedStudent.firstName + ' ' + ((d as any).linkedStudent.lastName || '')) : (d as any).linkedStudent) : ''),
      safeString((d as any).linkedStaff ? ((d as any).linkedStaff.firstName ? ((d as any).linkedStaff.firstName + ' ' + ((d as any).linkedStaff.lastName || '')) : (d as any).linkedStaff) : '')
    ]);

    const csv = [header.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))].join('\n');

    if (format === 'csv') {
      res.attachment('transactions.csv');
      res.type('text/csv');
      return res.send(csv);
    }

    if (format === 'excel') {
      try {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Transactions');

        // Title row
        const title = `Transactions Export`;
        sheet.mergeCells('A1:L1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = title;
        titleCell.font = { size: 16, bold: true } as any;
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' } as any;

        // Subtitle with filters and timestamp
        const ts = new Date().toISOString();
        sheet.mergeCells('A2:L2');
        const subCell = sheet.getCell('A2');
        subCell.value = `Generated: ${ts} ${ (req.query.from || req.query.to) ? `| Filters: ${req.query.from || '-'} to ${req.query.to || '-'}` : '' }`;
        subCell.font = { size: 10, italic: true } as any;

        // Header row (row 4 to leave space)
        const headerRowIndex = 4;
        sheet.insertRow(headerRowIndex, header);
        const headerRow = sheet.getRow(headerRowIndex);
        headerRow.eachCell((cell: any) => {
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } } as any; // blue
          cell.alignment = { horizontal: 'left' } as any;
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
          } as any;
        });

        // Add data rows starting after header
        rows.forEach(r => {
          const added = sheet.addRow(r);
          // format amount column (5th column -> E)
          try { added.getCell(5).numFmt = '#,##0.00'; } catch (e) {}
        });

        // Adjust column widths
        const colWidths = [18,12,24,40,14,18,18,18,16,12,18,18];
        sheet.columns.forEach((col, idx) => {
          col.width = colWidths[idx] || 15;
        });

        // Freeze header row and enable filters
        sheet.views = [{ state: 'frozen', ySplit: headerRowIndex } as any];
        headerRow.commit();

        const buffer = await workbook.xlsx.writeBuffer();
        res.attachment('transactions.xlsx');
        res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        return res.send(Buffer.from(buffer));
      } catch (e) {
        console.error('Failed to generate xlsx', e);
        // fallback to csv
        res.attachment('transactions.csv');
        res.type('text/csv');
        return res.send(csv);
      }
    }

    if (format === 'pdf') {
      try {
        res.attachment('transactions.pdf');
        res.type('application/pdf');

        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        doc.pipe(res as any);

        const title = 'Transactions Export';
        doc.fontSize(18).fillColor('#0f172a').text(title, { align: 'center' });
        doc.moveDown(0.25);
        const ts = new Date().toISOString();
        doc.fontSize(10).fillColor('#64748b').text(`Generated: ${ts}` + (req.query.from || req.query.to ? ` | Filters: ${req.query.from || '-'} to ${req.query.to || '-'}` : ''), { align: 'center' });
        doc.moveDown(1);

        // Table header
        const startX = doc.x;
        let y = doc.y;
        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const colWidths = [80,40,100,140,60,80,60,60,60,50,80,80];

        const renderHeader = () => {
          doc.rect(startX, y, pageWidth, 20).fill('#2563eb');
          doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
          let x = startX + 4;
          header.forEach((h, i) => {
            doc.text(String(h), x, y + 5, { width: colWidths[i], continued: false });
            x += colWidths[i];
          });
          y += 22;
          doc.fillColor('#0f172a').font('Helvetica').fontSize(9);
        };

        renderHeader();

        const rowsPerPage = 25;
        let rowCounter = 0;

        rows.forEach((r, idx) => {
          if (rowCounter >= rowsPerPage) { doc.addPage(); y = doc.y; renderHeader(); rowCounter = 0; }

          // alternating background
          if (idx % 2 === 0) {
            doc.rect(startX, y, pageWidth, 18).fill('#f8fafc').fillColor('#0f172a');
          }

          let x = startX + 4;
          r.forEach((cell: any, i: number) => {
            const text = (i === 4 && typeof cell === 'number') ? new Intl.NumberFormat('en-CM', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(cell) : String(cell || '');
            doc.fillColor('#0f172a').text(text, x, y + 4, { width: colWidths[i] });
            x += colWidths[i];
          });
          y += 18;
          rowCounter++;
        });

  // Totals block - compute from docs
  const incomeTotal = docs.reduce((s: number, d: any) => s + ((d.type === 'income') ? (Number(d.amount) || 0) : 0), 0);
  const expenseTotal = docs.reduce((s: number, d: any) => s + ((d.type === 'expense') ? (Number(d.amount) || 0) : 0), 0);
  const netTotal = incomeTotal - expenseTotal;

  doc.moveTo(startX, y + 6);
  doc.fontSize(11).font('Helvetica-Bold').text(`Total Assets: ${new Intl.NumberFormat('en-CM', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(incomeTotal)}`, { align: 'left' });
  doc.moveDown(0.3);
  doc.font('Helvetica-Bold').text(`Total Liabilities: ${new Intl.NumberFormat('en-CM', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(expenseTotal)}`, { align: 'left' });
  doc.moveDown(0.3);
  doc.font('Helvetica-Bold').text(`Equity: ${new Intl.NumberFormat('en-CM', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(netTotal)}`, { align: 'left' });

        doc.end();
        return;
      } catch (e) {
        console.error('Failed to generate pdf', e);
        res.attachment('transactions.csv');
        res.type('text/csv');
        return res.send(csv);
      }
    }

    if (format === 'email') {
      const to = req.query.to as string | undefined;
      // In a real system we'd generate the file and enqueue an email job. Here we simulate and log.
      console.info('Queueing export email', { to, count: docs.length, filter: req.query });
      return res.status(202).json({ status: 'queued', message: `Export queued for ${to || 'default email'}` });
    }

    // Unknown format: return CSV
    res.attachment('transactions.csv');
    return res.send(csv);
  } catch (err) {
    console.error('GET /api/accounting/export error', (err as any) && (err as any).stack ? (err as any).stack : err);
    res.status(500).json({ error: 'Failed to export' });
  }
});

// Reports: income statement, expense statement, balance sheet
router.get('/reports/income-statement', authMiddleware, requirePermission('accounting'), async (req: AuthRequest, res) => {
  try {
    const match: any = { type: 'income', status: 'approved' };
    if (req.query.from || req.query.to) {
      match.date = {};
      if (req.query.from) match.date.$gte = new Date(req.query.from as string);
      if (req.query.to) match.date.$lte = new Date(req.query.to as string);
    }
    if (req.query.branch) match.branch = req.query.branch;

    const byCategory = await OfficeTransaction.aggregate([
      { $match: match },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ] as any);

    const total = byCategory.reduce((s: number, b: any) => s + (b.total || 0), 0);
    res.json({ total, breakdown: byCategory });
  } catch (err) {
    console.error('GET /api/accounting/reports/income-statement error', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

router.get('/reports/expense-statement', authMiddleware, requirePermission('accounting'), async (req: AuthRequest, res) => {
  try {
    const match: any = { type: 'expense', status: 'approved' };
    if (req.query.from || req.query.to) {
      match.date = {};
      if (req.query.from) match.date.$gte = new Date(req.query.from as string);
      if (req.query.to) match.date.$lte = new Date(req.query.to as string);
    }
    if (req.query.branch) match.branch = req.query.branch;

    const byCategory = await OfficeTransaction.aggregate([
      { $match: match },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ] as any);

    const total = byCategory.reduce((s: number, b: any) => s + (b.total || 0), 0);
    res.json({ total, breakdown: byCategory });
  } catch (err) {
    console.error('GET /api/accounting/reports/expense-statement error', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

router.get('/reports/balance-sheet', authMiddleware, requirePermission('accounting'), async (req: AuthRequest, res) => {
  try {
    const match: any = { status: 'approved' };
    if (req.query.from || req.query.to) {
      match.date = {};
      if (req.query.from) match.date.$gte = new Date(req.query.from as string);
      if (req.query.to) match.date.$lte = new Date(req.query.to as string);
    }
    if (req.query.branch) match.branch = req.query.branch;

    const totals = await OfficeTransaction.aggregate([
      { $match: match },
      { $group: { _id: '$type', total: { $sum: '$amount' } } }
    ] as any);

    const incomeTotal = totals.find((t: any) => t._id === 'income')?.total || 0;
    const expenseTotal = totals.find((t: any) => t._id === 'expense')?.total || 0;
    const net = incomeTotal - expenseTotal;

    // Simple balance sheet: assets = incomeTotal, liabilities = expenseTotal, equity = net
    res.json({ assets: incomeTotal, liabilities: expenseTotal, equity: net });
  } catch (err) {
    console.error('GET /api/accounting/reports/balance-sheet error', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Summary: totals, breakdown, monthly trends
router.get('/summary', authMiddleware, requirePermission('accounting'), async (req: AuthRequest, res) => {
  try {
    const match: any = {};
    if (req.query.from || req.query.to) {
      match.date = {};
      if (req.query.from) match.date.$gte = new Date(req.query.from as string);
      if (req.query.to) match.date.$lte = new Date(req.query.to as string);
    }
    if (req.query.branch) match.branch = req.query.branch;

    // Only include approved transactions in summary
    match.status = 'approved';

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ];

    const totals = await OfficeTransaction.aggregate(pipeline as any);

    // Breakdown per category
    const breakdown = await OfficeTransaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: { category: '$category', type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.type': 1, total: -1 } }
    ] as any);

    // Monthly trends
    const monthlyTrends = await OfficeTransaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ] as any);

    // Calculate net income
    const incomeTotal = totals.find((t: any) => t._id === 'income')?.total || 0;
    const expenseTotal = totals.find((t: any) => t._id === 'expense')?.total || 0;
    const netIncome = incomeTotal - expenseTotal;

    res.json({
      totals,
      breakdown,
      monthlyTrends,
      summary: {
        totalIncome: incomeTotal,
        totalExpenses: expenseTotal,
        netIncome,
        transactionCount: totals.reduce((sum: number, t: any) => sum + (t.count || 0), 0)
      }
    });
  } catch (err) {
    console.error('GET /api/accounting/summary error', err);
    res.status(500).json({ error: 'Failed to compute summary' });
  }
});

export default router;
