import express from 'express';
import Department from '../models/Department';
import Program from '../models/Program';
import authMiddleware, { requirePermission, requireBranchAccess, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.get('/', authMiddleware, requirePermission(['departments:read','programs:read']), async (req: AuthRequest, res) => {
  try {
    // Fetch departments with program populated
    const depts = await Department.find().populate('program').lean();

    // Aggregate student counts by department
    const Student = (await import('../models/Student')).default;
    const match: any = {};
    if (req.user && !req.user.isSuperAdmin && req.user.branch) match.branch = req.user.branch;
    const counts = await Student.aggregate([
      { $match: match },
      { $group: { _id: '$department', studentsCount: { $sum: 1 } } }
    ] as any);
    const countMap: Record<string, number> = {};
    counts.forEach(c => { if (c && c._id) countMap[c._id.toString()] = c.studentsCount; });

    // Optional: future faculty collection counts could go here. For now placeholder 0.
    const result = depts.map(d => ({
      ...d,
      studentsCount: countMap[d._id.toString()] || 0,
      facultyCount: 0
    }));

    res.json(result);
  } catch (e:any) {
    res.status(500).json({ message: e?.message || 'Failed to load departments' });
  }
});

router.post('/', authMiddleware, requirePermission(['departments:create','programs:write']), async (req, res) => {
  try {
    const { name, code, program } = req.body;
    if (!name || !program) return res.status(400).json({ message: 'name and program are required' });
    const progDoc = await Program.findById(program).exec();
    if (!progDoc) return res.status(400).json({ message: 'program not found' });
    const dept = new Department({ name, code, program });
    await dept.save();
    await Program.findByIdAndUpdate(program, { $addToSet: { departments: dept._id } }).exec();
    res.status(201).json(dept);
  } catch (e:any) {
    res.status(400).json({ message: e?.message || 'failed to create department' });
  }
});

router.put('/:id', authMiddleware, requirePermission(['departments:update','programs:write']), async (req, res) => {
  try {
    const { program } = req.body;
    if (program) {
      const progDoc = await Program.findById(program).exec();
      if (!progDoc) return res.status(400).json({ message: 'program not found' });
    }
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(dept);
  } catch (e:any) {
    res.status(400).json({ message: e?.message || 'failed to update department' });
  }
});

router.delete('/:id', authMiddleware, requirePermission(['departments:delete','programs:write']), async (req, res) => {
  const dept = await Department.findByIdAndDelete(req.params.id);
  if (dept && dept.program) {
    const Program = (await import('../models/Program')).default;
    await Program.findByIdAndUpdate(dept.program, { $pull: { departments: dept._id } }).exec();
  }
  res.status(204).send();
});

export default router;
