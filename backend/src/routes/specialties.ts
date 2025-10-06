import express from 'express';
import Specialty from '../models/Specialty';
import Program from '../models/Program';
import Department from '../models/Department';
import { authMiddleware, AuthRequest, requirePermission, requireBranchAccess } from '../middleware/auth';

const router = express.Router();

// List specialties (optionally by program/department)
router.get('/', authMiddleware, requirePermission(['programs:read','departments:read']), async (req: AuthRequest, res) => {
  try {
    const filter: any = {};
    const { program, department, search } = req.query as any;
    if (program) filter.program = program;
    if (department) filter.department = department;
    if (search) filter.name = { $regex: String(search), $options: 'i' };

    const list = await Specialty.find(filter).populate('program', 'name').populate('department', 'name').sort({ name: 1 }).lean();
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: { message: 'Failed to fetch specialties', details: err?.message } });
  }
});

// Create specialty
router.post('/', authMiddleware, requirePermission(['programs:create','departments:read']), async (req: AuthRequest, res) => {
  try {
    const { name, program, department } = req.body || {};
    if (!name || !program || !department) return res.status(400).json({ error: { message: 'name, program and department are required' } });

    const p = await Program.findById(program);
    if (!p) return res.status(400).json({ error: { message: 'Invalid program' } });
    const d = await Department.findById(department);
    if (!d) return res.status(400).json({ error: { message: 'Invalid department' } });

    const exists = await Specialty.findOne({ name, program, department });
    if (exists) return res.status(409).json({ error: { message: 'Specialty already exists in this department' } });

    const s = await Specialty.create({ name, program, department, createdBy: req.user?.id });
    const populated = await Specialty.findById(s._id).populate('program', 'name').populate('department', 'name');
    res.status(201).json({ data: populated });
  } catch (err: any) {
    res.status(500).json({ error: { message: 'Failed to create specialty', details: err?.message } });
  }
});

// Update specialty
router.put('/:id', authMiddleware, requirePermission(['programs:update']), async (req: AuthRequest, res) => {
  try {
    const updates: any = {};
    ['name','isActive','program','department'].forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    if (updates.program && !(await Program.findById(updates.program))) return res.status(400).json({ error: { message: 'Invalid program' } });
    if (updates.department && !(await Department.findById(updates.department))) return res.status(400).json({ error: { message: 'Invalid department' } });

    const updated = await Specialty.findByIdAndUpdate(req.params.id, updates, { new: true }).populate('program', 'name').populate('department', 'name');
    if (!updated) return res.status(404).json({ error: { message: 'Specialty not found' } });
    res.json({ data: updated });
  } catch (err: any) {
    res.status(500).json({ error: { message: 'Failed to update specialty', details: err?.message } });
  }
});

// Delete specialty
router.delete('/:id', authMiddleware, requirePermission(['programs:delete']), async (req: AuthRequest, res) => {
  try {
    const deleted = await Specialty.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: { message: 'Specialty not found' } });
    res.json({ message: 'Specialty deleted' });
  } catch (err: any) {
    res.status(500).json({ error: { message: 'Failed to delete specialty', details: err?.message } });
  }
});

export default router;
