import { Router } from 'express';
import authMiddleware, { AuthRequest, requirePermission } from '../middleware/auth';
import TuitionPlan from '../models/TuitionPlan';
import Student from '../models/Student';
import { applyTuitionPlanToGroup, findDueInstallments, markReminderSent } from '../services/tuitionPlanAssignment';

const router = Router();

// Apply a plan to all matching students
router.post('/:id/apply', authMiddleware, requirePermission(['tuition:write','students:write']), async (req: AuthRequest, res) => {
  try {
    const { dryRun, limit } = req.body || {};
    const result = await applyTuitionPlanToGroup(req.params.id, { dryRun, limit });
    res.json({ data: result });
  } catch (e: any) {
    return res.status(400).json({ message: e.message || 'Failed to apply plan' });
  }
});

// List students for a specific installment by payment status
router.get('/:id/installments/:key/students', authMiddleware, requirePermission('students:read'), async (req: AuthRequest, res) => {
  try {
    const { status } = req.query; // paid|partial|unpaid
    const plan = await TuitionPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    const key = req.params.key;
    // find students assigned to this plan
    const students = await Student.find({ tuitionPlan: plan._id })
      .select('studentId names tuitionInstallments totalPaid balanceDue program department level')
      .lean();
    const rows: any[] = [];
    for (const s of students) {
      const ins: any = (s.tuitionInstallments || []).find((i: any) => i.key === key);
      if (!ins) continue;
      const amountDue = ins.amountDue || 0;
      const paid = ins.paid || 0;
      let bucket: 'paid'|'partial'|'unpaid' = 'unpaid';
      if (paid >= amountDue && amountDue > 0) bucket = 'paid';
      else if (paid > 0) bucket = 'partial';
      if (status && bucket !== status) continue;
      rows.push({ studentId: s.studentId, names: s.names, amountDue, paid, remaining: Math.max(0, amountDue - paid), status: ins.status, lastReminderSent: ins.lastReminderSent, timesReminded: ins.timesReminded });
    }
    res.json({ data: { count: rows.length, students: rows } });
  } catch (e) {
    console.error('Failed to list installment students', e);
    res.status(500).json({ message: 'Failed to list students' });
  }
});

// Run reminder scan - returns due list (caller can then send notifications)
router.get('/reminders/run', authMiddleware, requirePermission('tuition:read'), async (_req: AuthRequest, res) => {
  try {
    const due = await findDueInstallments();
    res.json({ data: { count: due.length, due } });
  } catch (e) {
    res.status(500).json({ message: 'Failed to run reminder scan' });
  }
});

// Mark reminder sent for a specific student installment
router.post('/reminders/mark', authMiddleware, requirePermission('tuition:write'), async (req: AuthRequest, res) => {
  try {
    const { studentId, installmentKey } = req.body || {};
    if (!studentId || !installmentKey) return res.status(400).json({ message: 'studentId and installmentKey required' });
    await markReminderSent(studentId, installmentKey);
    res.json({ message: 'ok' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to mark reminder' });
  }
});

export default router;
