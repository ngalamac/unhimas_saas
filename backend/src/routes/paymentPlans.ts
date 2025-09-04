import express from 'express';
import PaymentPlan from '../models/PaymentPlan';
import authMiddleware, { requirePermission, AuthRequest } from '../middleware/auth';
import { emitEvent } from '../lib/events';

const router = express.Router();

// GET /api/payment-plans
router.get('/', authMiddleware, requirePermission('students'), async (req: AuthRequest, res) => {
  try {
    const plans = await PaymentPlan.find().sort({ createdAt: -1 });
    res.json(plans);
  } catch (e) {
    console.error('GET /api/payment-plans error', e);
    res.status(500).json({ error: 'Failed to fetch payment plans' });
  }
});

// POST /api/payment-plans
router.post('/', authMiddleware, requirePermission('students'), async (req: AuthRequest, res) => {
  try {
    const { name, targetAmount, description, dueDate } = req.body;
    if (!name || !targetAmount) return res.status(400).json({ error: 'Missing required fields' });
    const p = new PaymentPlan({ name, targetAmount: Number(targetAmount), description, dueDate, createdBy: req.user?.id });
    await p.save();
  res.status(201).json(p);
  try { emitEvent('paymentPlan.created', { plan: p }); } catch (e) {}
  } catch (e) {
    console.error('POST /api/payment-plans error', e);
    res.status(500).json({ error: 'Failed to create payment plan' });
  }
});

// GET /api/payment-plans/:id
router.get('/:id', authMiddleware, requirePermission('students'), async (req: AuthRequest, res) => {
  try {
    const p = await PaymentPlan.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json(p);
  } catch (e) {
    console.error('GET /api/payment-plans/:id error', e);
    res.status(500).json({ error: 'Failed to fetch payment plan' });
  }
});

// PUT /api/payment-plans/:id
router.put('/:id', authMiddleware, requirePermission('students'), async (req: AuthRequest, res) => {
  try {
    const update = { ...(req.body || {}) };
    const p = await PaymentPlan.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json(p);
    try { emitEvent('paymentPlan.updated', { plan: p }); } catch (e) {}
  } catch (e) {
    console.error('PUT /api/payment-plans/:id error', e);
    res.status(500).json({ error: 'Failed to update payment plan' });
  }
});

// DELETE /api/payment-plans/:id
router.delete('/:id', authMiddleware, requirePermission('students'), async (req: AuthRequest, res) => {
  try {
    const p = await PaymentPlan.findByIdAndDelete(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
    try { emitEvent('paymentPlan.deleted', { id: req.params.id }); } catch (e) {}
  } catch (e) {
    console.error('DELETE /api/payment-plans/:id error', e);
    res.status(500).json({ error: 'Failed to delete payment plan' });
  }
});

export default router;
