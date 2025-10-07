import express from 'express';
import Program from '../models/Program';
import authMiddleware, { requirePermission } from '../middleware/auth';

const router = express.Router();

router.get('/', authMiddleware, requirePermission(['programs:read','students:read']), async (req, res) => {
  const programs = await Program.find().populate('departments');
  res.json(programs);
});

router.post('/', authMiddleware, requirePermission(['programs:create','programs:write','students:create']), async (req, res) => {
  const { name, type, subType, isActive, duration, semestersPerYear } = req.body;
  if (!name || !type) return res.status(400).json({ message: 'name and type are required' });
  const allowed = ['Undergraduate', 'Postgraduate'];
  if (!allowed.includes(type)) return res.status(400).json({ message: 'type must be Undergraduate or Postgraduate' });
  const program = new Program({ name, type, subType, isActive, duration: duration || 3, semestersPerYear: semestersPerYear || 2 });
  await program.save();
  res.status(201).json(program);
});

router.put('/:id', authMiddleware, requirePermission(['programs:update','programs:write']), async (req, res) => {
  const payload = req.body;
  if (payload.duration && payload.duration < 1) return res.status(400).json({ message: 'duration must be >= 1' });
  const program = await Program.findByIdAndUpdate(req.params.id, payload, { new: true });
  res.json(program);
});

router.delete('/:id', authMiddleware, requirePermission(['programs:delete','programs:write']), async (req, res) => {
  await Program.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

export default router;
