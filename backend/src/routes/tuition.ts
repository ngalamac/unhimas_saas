import express from 'express';
import TuitionPlan from '../models/TuitionPlan';
import authMiddleware, { AuthRequest, requirePermission } from '../middleware/auth';
import { emitEvent } from '../lib/events';

const router = express.Router();

// List tuition plans (optionally filter by program/department/level)
router.get('/plans', authMiddleware, requirePermission('students'), async (req: AuthRequest, res) => {
  try {
    const query: any = {};
    if (req.query.program) query.program = String(req.query.program);
    if (req.query.department) query.department = String(req.query.department);
    if (req.query.level) query.level = req.query.level;
    if (req.query.academicYear) query.academicYear = String(req.query.academicYear);
    const plans = await TuitionPlan.find(query).limit(200).sort({ academicYear: -1 });
    res.json(plans);
  } catch (e) {
    console.error('Error fetching tuition plans', e);
    res.status(500).json({ message: 'Failed to fetch tuition plans' });
  }
});

router.get('/plans/:id', authMiddleware, requirePermission('students'), async (req: AuthRequest, res) => {
  try {
    const plan = await TuitionPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Tuition plan not found' });
    res.json(plan);
  } catch (e) {
    console.error('Error fetching tuition plan', e);
    res.status(500).json({ message: 'Failed to fetch tuition plan' });
  }
});

// Create a tuition plan
router.post('/plans', authMiddleware, requirePermission('students'), async (req: AuthRequest, res) => {
  try {
    const body = req.body || {};
    const { program, department, level, academicYear, installments, name } = body;
    if (!name || !Array.isArray(installments) || installments.length === 0) {
      return res.status(400).json({ message: 'Name and at least one installment required' });
    }
    const doc = new TuitionPlan({ program, department, level, academicYear, installments, name, createdBy: req.user?.id });
    await doc.save();
    // emit event if available
    try { emitEvent('general', 'tuition.plan.created', { plan: doc }); } catch (e) {}
    res.status(201).json(doc);
  } catch (e) {
    console.error('Error creating tuition plan', e);
    res.status(500).json({ message: 'Failed to create tuition plan' });
  }
});

// Update a tuition plan
router.put('/plans/:id', authMiddleware, requirePermission('students'), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id;
    const body = req.body || {};
    const plan = await TuitionPlan.findById(id);
    if (!plan) return res.status(404).json({ message: 'Tuition plan not found' });
    // update allowed fields
    ['program', 'department', 'level', 'academicYear', 'installments', 'name'].forEach((k: any) => {
      if (body[k] !== undefined) (plan as any)[k] = body[k];
    });
    await plan.save();
    try { emitEvent('general', 'tuition.plan.updated', { plan }); } catch (e) {}
    res.json(plan);
  } catch (e) {
    console.error('Error updating tuition plan', e);
    res.status(500).json({ message: 'Failed to update tuition plan' });
  }
});

// Delete a tuition plan
router.delete('/plans/:id', authMiddleware, requirePermission('students'), async (req: AuthRequest, res) => {
  try {
    const id = req.params.id;
    const plan = await TuitionPlan.findByIdAndDelete(id);
    if (!plan) return res.status(404).json({ message: 'Tuition plan not found' });
    try { emitEvent('general', 'tuition.plan.deleted', { planId: id }); } catch (e) {}
    res.json({ ok: true });
  } catch (e) {
    console.error('Error deleting tuition plan', e);
    res.status(500).json({ message: 'Failed to delete tuition plan' });
  }
});

export default router;
