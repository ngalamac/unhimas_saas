import express from 'express';
import Payroll from '../models/Payroll';
import Staff from '../models/Staff';

const router = express.Router();

// list payroll runs
router.get('/', async (req, res) => {
  const items = await Payroll.find().sort({ date: -1 }).limit(200).populate('staffId').lean();
  const mapped = items.map((i: any) => ({ ...i, staffName: i.staffId?.name }));
  res.json({ data: mapped });
});

// create run
router.post('/', async (req, res) => {
  const { staffId, amount, notes } = req.body;
  if (!staffId || !amount) return res.status(400).json({ message: 'staffId and amount required' });
  const doc = await Payroll.create({ staffId, amount, notes });
  res.status(201).json({ data: doc });
});

// delete run
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const del = await Payroll.findByIdAndDelete(id).lean();
  if (!del) return res.status(404).json({ message: 'Not found' });
  res.json({ data: del });
});

export default router;
