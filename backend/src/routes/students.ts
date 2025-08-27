import express from 'express';
import Student from '../models/Student';
// Use require to avoid TS module resolution issues in some environments
const BranchModel: any = require('../models/Branch').default || require('../models/Branch');
import authMiddleware, { AuthRequest } from '../middleware/auth';

const router = express.Router();

function validateCameroonPhone(phone?: string) {
  if (!phone) return false;
  // normalize: remove non-digit characters
  const digits = phone.replace(/\D+/g, '');
  // Accept either:
  // - international form '237' + 9 digits (client may send +237xxxxxxxxx)
  // - local 9-digit form 'xxxxxxxxx'
  // This accepts any 9-digit subscriber number (not restricted to starting with 6).
  return /^(?:237\d{9}|\d{9})$/.test(digits);
}

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.max(1, Math.min(100, Number(req.query.limit || 10)));
    const skip = (page - 1) * pageSize;

    // Build base query
    const query: any = {};
    // If user is not SuperAdmin, require branch query param to scope results
    if (!(req.user && req.user.type === 'SuperAdmin')) {
      const branchId = String(req.query.branch || '');
      if (!branchId) return res.status(400).json({ message: 'branch query parameter is required' });
      query.branch = branchId;
    } else {
      // SuperAdmin may optionally pass branch to filter
      if (req.query.branch) query.branch = String(req.query.branch);
    }

    const [total, data] = await Promise.all([
      Student.countDocuments(query),
      Student.find(query).populate('program department').skip(skip).limit(pageSize).sort({ createdAt: -1 })
    ]);

    return res.json({ data, total, page, pageSize });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to fetch students' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const {
    firstName, lastName, dateOfBirth, placeOfBirth, phoneNumber, gender, program, department, guardian
  } = req.body;
  // debug incoming phone values
  // (remove or lower log level in production)
  // eslint-disable-next-line no-console
  // Log raw and normalized (digits-only) phone values to aid debugging
  // eslint-disable-next-line no-console
  try {
    const rawStudentPhone = phoneNumber || '';
    const rawGuardianPhone = guardian && guardian.contact ? guardian.contact : '';
    const digitsStudent = String(rawStudentPhone).replace(/\D+/g, '');
    const digitsGuardian = String(rawGuardianPhone).replace(/\D+/g, '');
    console.log('Incoming student phone raw:', rawStudentPhone, 'digits:', digitsStudent);
    console.log('Incoming guardian phone raw:', rawGuardianPhone, 'digits:', digitsGuardian);
  } catch (e) {
    // don't crash logging
    // eslint-disable-next-line no-console
    console.log('Error logging phone values', e);
  }
  const missing: string[] = [];
  if (!firstName) missing.push('firstName');
  if (!lastName) missing.push('lastName');
  if (!dateOfBirth) missing.push('dateOfBirth');
  if (!phoneNumber) missing.push('phoneNumber');
  if (!gender) missing.push('gender');
  if (!guardian || !guardian.name) missing.push('guardian.name');
  if (missing.length) return res.status(400).json({ message: 'Missing required fields', missing });

  // branch is required to attribute student to a branch
  const { branch } = req.body;
  if (!branch) return res.status(400).json({ message: 'branch is required and must be a valid branch id' });
  // validate branch exists
  try {
  const b = await BranchModel.findById(branch);
    if (!b) return res.status(400).json({ message: 'Provided branch does not exist' });
    // If the user is not SuperAdmin, ensure they are assigning to a branch they manage.
    if (req.user && req.user.type !== 'SuperAdmin') {
  const mgrId = (b.manager as any)?._id || (b.manager as any) || '';
      if (!req.user.id || String(req.user.id) !== String(mgrId)) {
        return res.status(403).json({ message: 'You are not allowed to assign students to this branch' });
      }
    }
  } catch (e) {
    return res.status(400).json({ message: 'Invalid branch id' });
  }
  if (!validateCameroonPhone(phoneNumber)) {
    return res.status(400).json({ message: 'Phone number must be either a 9-digit local number (e.g. 652278121) or an international +237 number (e.g. +237652278121)' });
  }

  // Duplicate detection: prevent creating the same student twice.
  // We'll consider a student duplicate when firstName, lastName, dateOfBirth and placeOfBirth all match.
  try {
    const existing = await Student.findOne({
      firstName: { $regex: `^${firstName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
      lastName: { $regex: `^${lastName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
      dateOfBirth: new Date(dateOfBirth),
      placeOfBirth: { $regex: `^${placeOfBirth.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
    });
    if (existing) {
      // log duplicate attempt for audit (include requester and branch)
      try {
        // eslint-disable-next-line no-console
        console.log('Duplicate student attempt:', {
          requester: req.user ? req.user.id : 'unknown',
          branch: branch || null,
          matchedStudentId: existing._id,
          payload: { firstName, lastName, dateOfBirth, placeOfBirth }
        });
      } catch (e) {
        // ignore logging errors
      }
      return res.status(409).json({ message: 'A student with the same name, date of birth and place of birth already exists' });
    }
  } catch (e) {
    // if duplicate-check fails for some reason, log and continue to attempt save (avoid blocking creation)
    // eslint-disable-next-line no-console
    console.error('Duplicate check error', e);
  }

  const studentData = { ...req.body };
  studentData.branch = req.body.branch;
  // ensure profilePicture is a URL if provided
  if (studentData.profilePicture && typeof studentData.profilePicture !== 'string') {
    delete studentData.profilePicture;
  }

  const student = new Student(studentData);
  try {
    await student.save();
    return res.status(201).json(student);
  } catch (e: any) {
    // handle duplicate key error coming from unique index
    if (e && e.code === 11000) {
      return res.status(409).json({ message: 'A student with the same identity already exists' });
    }
    console.error('Failed to save student', e);
    return res.status(500).json({ message: 'Failed to save student' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  const student = await Student.findById(req.params.id).populate('program department branch');
  if (!student) return res.status(404).json({ message: 'Not found' });
  if (req.user && req.user.type !== 'SuperAdmin') {
    const branchId = student.branch ? String(student.branch) : '';
    const reqBranch = String(req.query.branch || '');
    if (!reqBranch || reqBranch !== branchId) return res.status(403).json({ message: 'Not authorized to view this student' });
  }
  res.json(student);
});

router.put('/:id', async (req, res) => {
  const {
    firstName, lastName, dateOfBirth, placeOfBirth, phoneNumber, gender, guardian
  } = req.body;
  if (!firstName || !lastName || !dateOfBirth || !phoneNumber || !gender || !guardian || !guardian.name) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  if (!validateCameroonPhone(phoneNumber)) {
    return res.status(400).json({ message: 'Phone number must be either a 9-digit local number (e.g. 652278121) or an international +237 number (e.g. +237652278121)' });
  }

  const updateData = { ...req.body };
  if (updateData.profilePicture && typeof updateData.profilePicture !== 'string') {
    delete updateData.profilePicture;
  }

  const student = await Student.findByIdAndUpdate(req.params.id, updateData, { new: true });
  res.json(student);
});

router.delete('/:id', async (req, res) => {
  await Student.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

export default router;
