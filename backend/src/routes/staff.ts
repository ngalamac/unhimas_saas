import express from 'express';
import Staff from '../models/Staff';

const router = express.Router();

// List staff
router.get('/', async (req, res) => {
  const items = await Staff.find().sort({ createdAt: -1 }).lean();
  res.json({ data: items });
});

// Create
router.post('/', async (req, res) => {
  const { name, role, email } = req.body;
  if (!name) return res.status(400).json({ message: 'Name required' });
  const doc = await Staff.create({ name, role, email });
  res.status(201).json({ data: doc });
});

// Update
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, role, email } = req.body;
  const updated = await Staff.findByIdAndUpdate(id, { name, role, email }, { new: true }).lean();
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json({ data: updated });
});

// Delete
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const deleted = await Staff.findByIdAndDelete(id).lean();
  if (!deleted) return res.status(404).json({ message: 'Not found' });
  res.json({ data: deleted });
});

export default router;
// Stats overview endpoint
router.get('/stats/overview', async (req, res) => {
  try {
    const totalStaff = await Staff.countDocuments();
    const activeStaff = await Staff.countDocuments({ isActive: true });
    res.json({ totalStaff, activeStaff });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch staff stats' });
  }
});
