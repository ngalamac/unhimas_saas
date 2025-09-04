import express from 'express';
import Department from '../models/Department';

const router = express.Router();

router.get('/', async (req, res) => {
  const depts = await Department.find().populate('program');
  res.json(depts);
});

router.post('/', async (req, res) => {
  const { name, code, program } = req.body;
  if (!name || !program) return res.status(400).json({ message: 'name and program are required' });
  const dept = new Department({ name, code, program });
  await dept.save();
  // push department into program
  const Program = (await import('../models/Program')).default;
  await Program.findByIdAndUpdate(program, { $addToSet: { departments: dept._id } }).exec();
  res.status(201).json(dept);
});

router.put('/:id', async (req, res) => {
  const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(dept);
});

router.delete('/:id', async (req, res) => {
  const dept = await Department.findByIdAndDelete(req.params.id);
  if (dept && dept.program) {
    const Program = (await import('../models/Program')).default;
    await Program.findByIdAndUpdate(dept.program, { $pull: { departments: dept._id } }).exec();
  }
  res.status(204).send();
});

export default router;
