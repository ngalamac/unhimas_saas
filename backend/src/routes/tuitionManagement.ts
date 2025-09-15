import express from 'express';
import authMiddleware, { AuthRequest, requirePermission } from '../middleware/auth';
import TuitionStructure from '../models/TuitionStructure';
import Student from '../models/Student';
import TuitionTransaction from '../models/TuitionTransaction';
import mongoose from 'mongoose';

// Lazy requires inside handlers for optional models/services
// (e.g. OHADAJournalEntry, report generation, reminder mailer) to avoid circular deps.

const router = express.Router();

// List structures with optional filters
router.get('/structures', authMiddleware, requirePermission('students'), async (req: AuthRequest, res) => {
  try {
    const query: any = {};
    if (req.query.program) query.program = req.query.program;
    if (req.query.department) query.department = req.query.department;
    if (req.query.level) query.level = req.query.level;
    if (req.query.academicYear) query.academicYear = req.query.academicYear;

    const docs = await TuitionStructure.find(query)
      .populate('program', 'name')
      .populate('department', 'name')
      .sort({ createdAt: -1 })
      .limit(500);

    res.json({ data: docs });
  } catch (e) {
    console.error('Error fetching tuition structures', e);
    res.status(500).json({ error: { message: 'Failed to fetch tuition structures' } });
  }
});

// ---------------------------------------------------------------------------
// STUDENT TUITION RECORDS (list + single)
// ---------------------------------------------------------------------------
router.get('/students/records', authMiddleware, requirePermission('students:read'), async (req: AuthRequest, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const query: any = {};
    if (req.query.program) query.program = req.query.program;
    if (req.query.department) query.department = req.query.department;
    if (req.query.level) query.level = Number(req.query.level);
    if (req.query.status) query.tuitionStatus = req.query.status;
    if (req.query.branch) query.branch = req.query.branch;

    const [records, total] = await Promise.all([
      Student.find(query)
        .select('_id names studentId program department level tuitionStatus tuitionInstallments totalPaid balanceDue branch')
        .populate('program', 'name')
        .populate('department', 'name')
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit)
        .lean(),
      Student.countDocuments(query)
    ]);

    // Normalize each record into a tuition summary shape
    const data = records.map(r => {
      const installments = (r.tuitionInstallments || []).map((i: any) => ({
        key: i.key,
        label: i.label,
        amountDue: i.amountDue || 0,
        paid: i.paid || 0,
        dueDate: i.dueDate || null,
        status: i.status || 'Pending'
      }));
      const totalDue = installments.reduce((s: number, it: any) => s + (it.amountDue || 0), 0);
      const paid = (r.totalPaid != null ? r.totalPaid : installments.reduce((s: number, it: any) => s + (it.paid || 0), 0));
      const balance = r.balanceDue != null ? r.balanceDue : Math.max(0, totalDue - paid);
      return {
        studentId: r._id,
        names: (r as any).names,
        studentCode: r.studentId,
        program: (r as any).program,
        department: (r as any).department,
        level: r.level,
        tuitionStatus: r.tuitionStatus,
        totalDue,
        totalPaid: paid,
        balanceDue: balance,
        installments
      };
    });

    res.json({ data, meta: { total, page, pageSize: limit, pages: Math.ceil(total / limit) } });
  } catch (e) {
    console.error('Error listing student tuition records', e);
    res.status(500).json({ error: { message: 'Failed to fetch student tuition records' } });
  }
});

router.get('/students/:id/record', authMiddleware, requirePermission('students:read'), async (req: AuthRequest, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(String(req.params.id))) {
      return res.status(400).json({ error: { message: 'Invalid student id' } });
    }
    const student = await Student.findById(req.params.id)
      .populate('program', 'name')
      .populate('department', 'name');
    if (!student) return res.status(404).json({ error: { message: 'Student not found' } });
    const installments = (student.tuitionInstallments || []).map((i: any) => ({
      key: i.key,
      label: i.label,
      amountDue: i.amountDue || 0,
      paid: i.paid || 0,
      dueDate: i.dueDate || null,
      status: i.status || 'Pending'
    }));
    const totalDue = installments.reduce((s: number, it: any) => s + (it.amountDue || 0), 0);
    const paid = student.totalPaid != null ? student.totalPaid : installments.reduce((s: number, it: any) => s + (it.paid || 0), 0);
    const balance = student.balanceDue != null ? student.balanceDue : Math.max(0, totalDue - paid);
    res.json({ data: { studentId: student._id, names: student.names, studentCode: student.studentId, tuitionStatus: student.tuitionStatus, totalDue, totalPaid: paid, balanceDue: balance, installments } });
  } catch (e) {
    console.error('Error fetching student tuition record', e);
    res.status(500).json({ error: { message: 'Failed to fetch tuition record' } });
  }
});

// ---------------------------------------------------------------------------
// PAYMENTS
// ---------------------------------------------------------------------------
router.post('/payments', authMiddleware, requirePermission(['students:write','tuition:write']), async (req: AuthRequest, res) => {
  try {
    const { studentId, installmentKey, amount, paymentMethod, notes, paymentDate } = req.body || {};
    if (!studentId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ error: { message: 'studentId and positive amount are required' } });
    }
    if (!mongoose.Types.ObjectId.isValid(String(studentId))) {
      return res.status(400).json({ error: { message: 'Invalid studentId' } });
    }
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ error: { message: 'Student not found' } });

    // Create tuition transaction (simplified vs students route one)
    const tx = await TuitionTransaction.create({
      student: student._id,
      amount: Number(amount),
      currency: 'XAF',
      installmentKey: installmentKey || undefined,
      method: paymentMethod || 'Cash',
      notes: notes || '',
      createdBy: req.user?.id,
      createdAt: paymentDate ? new Date(paymentDate) : new Date()
    });

    // Apply payment to installment if provided
    if (installmentKey) {
      const ins = (student.tuitionInstallments || []).find((i: any) => i.key === installmentKey);
      if (ins) {
        const remaining = Math.max(0, (ins.amountDue || 0) - (ins.paid || 0));
        const apply = Math.min(remaining, Number(amount));
        ins.paid = (ins.paid || 0) + apply;
        ins.status = ins.paid >= (ins.amountDue || 0) ? 'Paid' : 'Partial';
      }
    }
    // Recompute aggregate totals
    const arr = student.tuitionInstallments || [];
    if (arr.length) {
      student.totalPaid = arr.reduce((s, it) => s + (it.paid || 0), 0);
      student.balanceDue = arr.reduce((s, it) => s + Math.max(0, (it.amountDue || 0) - (it.paid || 0)), 0);
    } else {
      student.totalPaid = (student.totalPaid || 0) + Number(amount);
      if (student.balanceDue == null) student.balanceDue = 0;
    }
    student.payments = student.payments || [];
    student.payments.push(tx._id);

    // Derive global status
    if ((student.balanceDue || 0) <= 0) student.tuitionStatus = 'Paid';
    else if ((student.tuitionInstallments || []).some(i => i.status === 'Overdue')) student.tuitionStatus = 'Overdue';
    else if ((student.totalPaid || 0) > 0) student.tuitionStatus = 'Partial';
    else student.tuitionStatus = 'Pending';
    await student.save();

    res.status(201).json({ data: { payment: tx, updatedRecord: { totalPaid: student.totalPaid, balanceDue: student.balanceDue, tuitionStatus: student.tuitionStatus } } });
  } catch (e) {
    console.error('Error recording tuition payment', e);
    res.status(500).json({ error: { message: 'Failed to record payment' } });
  }
});

router.get('/students/:id/payments', authMiddleware, requirePermission('students:read'), async (req: AuthRequest, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(String(req.params.id))) return res.status(400).json({ error: { message: 'Invalid student id' } });
    const student = await Student.findById(req.params.id).select('_id');
    if (!student) return res.status(404).json({ error: { message: 'Student not found' } });
    const match: any = { student: student._id };
    if (req.query.installmentKey) match.installmentKey = req.query.installmentKey;
    if (req.query.fromDate || req.query.toDate) {
      match.createdAt = {};
      if (req.query.fromDate) (match.createdAt as any).$gte = new Date(String(req.query.fromDate));
      if (req.query.toDate) (match.createdAt as any).$lte = new Date(String(req.query.toDate));
    }
    const payments = await TuitionTransaction.find(match).sort({ createdAt: -1 }).limit(500).lean();
    res.json({ data: payments });
  } catch (e) {
    console.error('Error fetching payment history', e);
    res.status(500).json({ error: { message: 'Failed to fetch payment history' } });
  }
});

// ---------------------------------------------------------------------------
// REMINDERS (placeholder implementation)
// ---------------------------------------------------------------------------
router.post('/reminders/send', authMiddleware, requirePermission(['students:read','tuition:write']), async (req: AuthRequest, res) => {
  try {
    // For now simply return a stub; real implementation would queue emails/SMS
    const { studentId } = req.body || {};
    let reminders: any[] = [];
    if (studentId && mongoose.Types.ObjectId.isValid(String(studentId))) {
      const student = await Student.findById(studentId).select('_id names tuitionInstallments');
      if (student) {
        reminders = (student.tuitionInstallments || []).filter((it: any) => (it.status !== 'Paid')).map((it: any) => ({
          student: student._id,
          installmentKey: it.key,
          type: 'generic_notice',
          status: 'queued'
        }));
      }
    }
    res.json({ data: { sent: reminders.length, failed: 0, reminders } });
  } catch (e) {
    console.error('Failed to send reminders', e);
    res.status(500).json({ error: { message: 'Failed to send reminders' } });
  }
});

router.get('/students/:id/reminders', authMiddleware, requirePermission('students:read'), async (_req: AuthRequest, res) => {
  // Placeholder: would fetch from a reminders collection
  res.json({ data: [] });
});

// ---------------------------------------------------------------------------
// ANALYTICS
// ---------------------------------------------------------------------------
router.get('/analytics', authMiddleware, requirePermission('students:read'), async (req: AuthRequest, res) => {
  try {
    const match: any = {};
    if (req.query.branch) match.branch = req.query.branch;
    if (req.query.program) match.program = req.query.program;
    if (req.query.department) match.department = req.query.department;
    if (req.query.level) match.level = Number(req.query.level);

    // Basic aggregation summarizing tuition status & totals
    const students = await Student.find(match).select('tuitionStatus totalPaid balanceDue tuitionInstallments').limit(2000).lean();
    let totalDue = 0; let totalPaid = 0; let balance = 0;
    const statusCounts: any = { Paid: 0, Partial: 0, Pending: 0, Overdue: 0 };
    for (const s of students) {
      statusCounts[s.tuitionStatus as string] = (statusCounts[s.tuitionStatus as string] || 0) + 1;
      const ins = (s.tuitionInstallments || []) as any[];
      const due = ins.reduce((sum, it) => sum + (it.amountDue || 0), 0);
      const paid = s.totalPaid != null ? s.totalPaid : ins.reduce((sum, it) => sum + (it.paid || 0), 0);
      const bal = s.balanceDue != null ? s.balanceDue : Math.max(0, due - paid);
      totalDue += due;
      totalPaid += paid;
      balance += bal;
    }
    res.json({ data: { totals: { totalDue, totalPaid, balance }, status: statusCounts, count: students.length } });
  } catch (e) {
    console.error('Error building tuition analytics', e);
    res.status(500).json({ error: { message: 'Failed to load analytics' } });
  }
});

// ---------------------------------------------------------------------------
// REPORT EXPORT (very simple CSV placeholder)
// ---------------------------------------------------------------------------
router.get('/reports/export', authMiddleware, requirePermission('students:read'), async (req: AuthRequest, res) => {
  try {
    const format = String(req.query.format || 'csv');
    const reportType = String(req.query.reportType || 'collection_summary');
    if (!['csv','excel','pdf'].includes(format)) {
      return res.status(400).json({ error: { message: 'Unsupported format' } });
    }
    // Just reuse analytics data for placeholder
    const students = await Student.find({}).select('names studentId tuitionStatus totalPaid balanceDue').limit(5000).lean();
    const header = 'studentId,names,status,totalPaid,balanceDue';
    const lines = students.map(s => `${s.studentId},"${(s as any).names}",${s.tuitionStatus},${s.totalPaid || 0},${s.balanceDue || 0}`);
    const csv = [header, ...lines].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="tuition-${reportType}.${format === 'csv' ? 'csv' : 'csv'}"`);
    res.send(csv);
  } catch (e) {
    console.error('Failed exporting tuition report', e);
    res.status(500).json({ error: { message: 'Failed to export report' } });
  }
});

// ---------------------------------------------------------------------------
// OHADA SYNC PLACEHOLDER
// ---------------------------------------------------------------------------
router.post('/ohada/sync', authMiddleware, requirePermission('students:read'), async (req: AuthRequest, res) => {
  try {
    // Placeholder simply returns success with 0 synced
    res.json({ data: { synced: 0, errors: [] } });
  } catch (e) {
    res.status(500).json({ error: { message: 'Failed to sync with OHADA' } });
  }
});

// Create structure
router.post('/structures', authMiddleware, requirePermission('students'), async (req: AuthRequest, res) => {
  try {
    const body = req.body || {};
    const { name, program, department, level, academicYear, installments, totalAmount } = body;
    if (!name || !program || !department || !level || !academicYear || !Array.isArray(installments) || installments.length === 0) {
      return res.status(400).json({ error: { message: 'Missing required fields' } });
    }
    const doc = await TuitionStructure.create({
      name,
      program,
      department,
      level,
      academicYear,
      installments,
      totalAmount: totalAmount ?? installments.reduce((s: number, i: any) => s + (i.amount || 0), 0),
      createdBy: req.user?.id
    });
    await doc.populate('program', 'name');
    await doc.populate('department', 'name');
    res.status(201).json({ data: doc });
  } catch (e: any) {
    console.error('Error creating tuition structure', e);
    if (e.name === 'ValidationError') {
      return res.status(400).json({ error: { message: e.message } });
    }
    res.status(500).json({ error: { message: 'Failed to create tuition structure' } });
  }
});

// Update structure
router.put('/structures/:id', authMiddleware, requirePermission('students'), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id;
    const body = req.body || {};
    const doc = await TuitionStructure.findById(id);
    if (!doc) return res.status(404).json({ error: { message: 'Structure not found' } });

    ['name','program','department','level','academicYear','installments','totalAmount','isActive'].forEach((k: string) => {
      if (body[k] !== undefined) (doc as any)[k] = body[k];
    });
    (doc as any).updatedBy = req.user?.id;
    await doc.save();
    await doc.populate('program', 'name');
    await doc.populate('department', 'name');
    res.json({ data: doc });
  } catch (e) {
    console.error('Error updating tuition structure', e);
    res.status(500).json({ error: { message: 'Failed to update tuition structure' } });
  }
});

// Delete structure
router.delete('/structures/:id', authMiddleware, requirePermission('students'), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id;
    const doc = await TuitionStructure.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ error: { message: 'Structure not found' } });
    res.status(204).send();
  } catch (e) {
    console.error('Error deleting tuition structure', e);
    res.status(500).json({ error: { message: 'Failed to delete tuition structure' } });
  }
});

// Simple OHADA account validation placeholder
router.get('/ohada/validate-accounts', authMiddleware, requirePermission('students'), async (_req: AuthRequest, res) => {
  try {
    // Placeholder: real implementation would cross-check required codes
    res.json({ data: { valid: true, missingAccounts: [] } });
  } catch (e) {
    res.status(500).json({ error: { message: 'Failed to validate OHADA accounts' } });
  }
});

export default router;
