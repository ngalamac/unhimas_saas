import express from 'express';
import Course from '../models/Course';
import Program from '../models/Program';
import Department from '../models/Department';
import Specialty from '../models/Specialty';

const router = express.Router();

// list courses with optional filters
router.get('/', async (req, res) => {
  const { programId, departmentId, specialtyId, semester } = req.query as any;
  const filter: any = {};
  if (programId) filter.program = programId;
  if (departmentId) filter.department = departmentId;
  if (specialtyId) filter.specialty = specialtyId;
  if (semester) filter.semester = Number(semester);

  const courses = await Course.find(filter).populate('program department specialty');
  res.json(courses);
});

router.post('/', async (req, res) => {
  const { title, code, credit, department, semester, caWeight, examWeight, program: bodyProgram, specialty: bodySpecialty } = req.body;
  if (!title || !code || !department) return res.status(400).json({ message: 'title, code and department are required' });
  try {
    const dept = await Department.findById(department).lean();
    if (!dept) return res.status(400).json({ message: 'department not found' });

    // Gather diagnostics for easier debugging on client
    const diagnostics: any = { bodyProgramProvided: !!bodyProgram, departmentHasProgram: !!dept.program };

    // Prefer explicitly provided body program (user selection) over department linkage
    let programId: any = bodyProgram || dept.program;
    let program = programId ? await Program.findById(programId) : null;
    // If still not found and dept has a different program id, try that as fallback
    if (!program && dept.program && dept.program !== programId) {
      diagnostics.firstLookupId = String(programId || '');
      diagnostics.retryWithDeptProgram = String(dept.program);
      programId = dept.program;
      program = await Program.findById(programId);
      diagnostics.deptFallbackTried = true;
    }
    diagnostics.finalProgramId = String(programId || '');
    if (!program) return res.status(400).json({ message: 'associated program not found', diagnostics });

    const maxSem = (program.duration ?? 1) * (program.semestersPerYear ?? 1);
  if (semester && (semester < 1 || semester > maxSem)) return res.status(400).json({ message: 'semester out of bounds for program', maxSemester: maxSem, diagnostics });

    // validate specialty if provided
    let specialtyId: any = bodySpecialty;
    if (specialtyId) {
      const spec = await Specialty.findById(specialtyId).lean();
      if (!spec) return res.status(400).json({ message: 'specialty not found' });
      if (String(spec.department) !== String(department)) return res.status(400).json({ message: 'specialty does not belong to department' });
      if (programId && String(spec.program) !== String(programId)) return res.status(400).json({ message: 'specialty does not belong to program' });
      if (!programId) { programId = spec.program; program = await Program.findById(programId); }
    }

  const course = new Course({ title, code, credit, program: programId, department, specialty: specialtyId, semester, caWeight, examWeight });
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
