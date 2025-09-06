import express from 'express';
import Course from '../models/Course';
import Program from '../models/Program';
import Department from '../models/Department';

const router = express.Router();

// list courses with optional filters
router.get('/', async (req, res) => {
  const { programId, departmentId, semester } = req.query as any;
  const filter: any = {};
  if (programId) filter.program = programId;
  if (departmentId) filter.department = departmentId;
  if (semester) filter.semester = Number(semester);

  const courses = await Course.find(filter).populate('program department');
  res.json(courses);
});

router.post('/', async (req, res) => {
  const { title, code, credit, department, semester, caWeight, examWeight } = req.body;
  if (!title || !code || !department) return res.status(400).json({ message: 'title, code and department are required' });

  const dept = await Department.findById(department);
  if (!dept) return res.status(400).json({ message: 'department not found' });

  // derive program and validate semester bounds before saving
  const program = await Program.findById(dept.program);
  if (!program) return res.status(400).json({ message: 'associated program for department not found' });
  const maxSem = (program.duration ?? 1) * (program.semestersPerYear ?? 1);
  if (semester && (semester < 1 || semester > maxSem)) return res.status(400).json({ message: 'semester out of bounds for program' });

  try {
    const course = new Course({ title, code, credit, program: dept.program, department, semester, caWeight, examWeight });
    await course.save();
    res.status(201).json(course);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'could not create course' });
  }
});

router.put('/:id', async (req, res) => {
  const payload = req.body;
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, payload, { new: true });
    res.json(course);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'could not update course' });
  }
});

router.delete('/:id', async (req, res) => {
  await Course.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

export default router;
