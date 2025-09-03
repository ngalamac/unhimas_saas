import express from 'express';
import OfficeTransaction from '../models/OfficeTransaction';
import Category from '../models/Category';
import { requirePermission, authMiddleware, requireBranchAccess, AuthRequest } from '../middleware/auth';
import User from '../models/User';
import Student from '../models/Student';
import Staff from '../models/Staff';
import BranchModel from '../models/BranchModel';
import mongoose from 'mongoose';

const router = express.Router();

// List transactions with filters, pagination (lazy loading)
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
      amount, 
      date, 
      linkedStudent, 
      linkedStaff, 
      description,
      reference,
      paymentMethod,
      attachments
    } = req.body;
    
    if (!type || !category || !amount) {
      return res.status(400).json({ error: 'Missing required fields: type, category, amount' });
    }
    
    // Verify category exists and matches type
    const cat = await Category.findOne({ name: category, type });
    if (!cat) {
      return res.status(400).json({ error: 'Invalid category or category type mismatch' });
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
    
    const tx = await OfficeTransaction.create({
      type,
      category,
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
    
    // Populate the response
    const populatedTx = await OfficeTransaction.findById(tx._id)
      .populate('registeredBy', 'name email')
      .populate('branch', 'name')
      .populate('linkedStudent', 'firstName lastName studentId')
      .populate('linkedStaff', 'firstName lastName employeeId');
    
    res.status(201).json(populatedTx);
  } catch (err) {
    console.error('POST /api/accounting error', err);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Get single transaction
router.get('/:id', authMiddleware, requirePermission('accounting'), async (req, res) => {
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
router.put('/:id', authMiddleware, requirePermission('accounting'), async (req, res) => {
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
router.delete('/:id', authMiddleware, requirePermission('accounting'), async (req, res) => {
  try {
    const r = await OfficeTransaction.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/accounting/:id error', err);
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// Summary: totals and breakdown
router.get('/summary/overview', authMiddleware, requireBranchAccess(), requirePermission('accounting'), async (req: AuthRequest, res) => {
  try {
    const match: any = {};
    
    // Branch filtering
    if (!req.user?.isSuperAdmin && req.user?.branch) {
      match.branch = new mongoose.Types.ObjectId(req.user.branch);
    } else if (req.query.branch) {
      match.branch = new mongoose.Types.ObjectId(req.query.branch as string);
    }
    
    if (req.query.from || req.query.to) {
      match.date = {};
      if (req.query.from) match.date.$gte = new Date(req.query.from as string);
      if (req.query.to) match.date.$lte = new Date(req.query.to as string);
    }
    
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
    const incomeTotal = totals.find(t => t._id === 'income')?.total || 0;
    const expenseTotal = totals.find(t => t._id === 'expense')?.total || 0;
    const netIncome = incomeTotal - expenseTotal;
    
    res.json({ 
      totals, 
      breakdown, 
      monthlyTrends,
      summary: {
        totalIncome: incomeTotal,
        totalExpenses: expenseTotal,
        netIncome,
        transactionCount: totals.reduce((sum, t) => sum + t.count, 0)
      }
    });
  } catch (err) {
    console.error('GET /api/accounting/summary error', err);
    res.status(500).json({ error: 'Failed to compute summary' });
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

// Export CSV
router.get('/export', authMiddleware, requirePermission('accounting'), async (req, res) => {
  try {
    const filter: any = {};
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = new Date(req.query.from as string);
      if (req.query.to) filter.date.$lte = new Date(req.query.to as string);
    }
    const docs = await OfficeTransaction.find(filter).sort({ date: 1 }).populate('registeredBy', 'name email').lean();
    const rows = docs.map(d => [
      d.date.toISOString(),
      d.type,
      d.category,
      (d.description || '').replace(/"/g, '""'),
      String(d.amount),
      (d.registeredBy as any)?.name || ''
    ]);
    const header = ['date','type','category','description','amount','registeredBy'];
    const csv = [header.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))].join('\n');
    res.attachment('transactions.csv');
    res.send(csv);
  } catch (err) {
    console.error('GET /api/accounting/export error', err);
    res.status(500).json({ error: 'Failed to export' });
  }
});

export default router;
