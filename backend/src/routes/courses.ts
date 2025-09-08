import express from 'express';
import Course from '../models/Course';
import Program from '../models/Program';
import Department from '../models/Department';

const router = express.Router();

// list courses with optional filters
router.get('/', async (req, res) => {
  const { programId, specialtyId, semester } = req.query as any;
  const filter: any = {};
  if (programId) filter.program = programId;
  if (specialtyId) filter.specialty = specialtyId;
  if (semester) filter.semester = Number(semester);

  const courses = await Course.find(filter).populate('program department specialty');
  res.json(courses);
});

router.post('/', async (req, res) => {
  const { title, code, credit, specialty, semester, caWeight, examWeight } = req.body;
  if (!title || !code || !specialty || !semester) {
    return res.status(400).json({ message: 'title, code, specialty, and semester are required' });
  }

  try {
    const course = new Course({ title, code, credit, specialty, semester, caWeight, examWeight });
    await course.save();
    // The pre-save hook will populate department and program and validate the semester.
    const populatedCourse = await Course.findById(course._id).populate('program department specialty');
    res.status(201).json(populatedCourse);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Could not create course. Check if specialty is valid and semester is within program bounds.' });
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
