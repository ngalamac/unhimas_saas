import express from 'express';
import Student from '../models/Student';
import BranchModel from '../models/BranchModel';
import mongoose from 'mongoose';
import authMiddleware, { AuthRequest, requirePermission, requireBranchAccess } from '../middleware/auth';
import { emitEvent } from '../lib/events';

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

router.get('/', authMiddleware, requirePermission('students'), requireBranchAccess(), async (req: AuthRequest, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.max(1, Math.min(100, Number(req.query.limit || 10)));
    const skip = (page - 1) * pageSize;

    // Build base query with filters
    const query: any = {};
    
    // Branch filtering is handled by requireBranchAccess middleware
    if (req.query.branch) {
      query.branch = String(req.query.branch);
    }

    // Additional filters
    const search = String(req.query.search || '').trim();
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { firstName: re },
        { lastName: re },
        { names: re },
        { email: re },
        { studentId: re }
      ];
    }
    if (req.query.program) {
      query.program = String(req.query.program);
    }
    if (req.query.department) {
      query.department = String(req.query.department);
    }
    if (req.query.tuitionStatus) {
      query.tuitionStatus = String(req.query.tuitionStatus);
    }
    if (req.query.enrollmentStatus) {
      query.enrollmentStatus = String(req.query.enrollmentStatus);
    }
    if (req.query.academicYear) {
      query.academicYear = String(req.query.academicYear);
    }
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    const [total, data, paidCount, partialCount, pendingCount, overdueCount] = await Promise.all([
      Student.countDocuments(query),
      Student.find(query)
        .populate('program department branch createdBy lastModifiedBy')
        .skip(skip)
        .limit(pageSize)
        .sort({ createdAt: -1 }),
      Student.countDocuments({ ...query, tuitionStatus: 'Paid' }),
      Student.countDocuments({ ...query, tuitionStatus: 'Partial' }),
      Student.countDocuments({ ...query, tuitionStatus: 'Pending' }),
      Student.countDocuments({ ...query, tuitionStatus: 'Overdue' }),
    ]);

    const aggregates = { 
      paid: paidCount, 
      partial: partialCount, 
      pending: pendingCount, 
      overdue: overdueCount 
    };
    return res.json({ data, total, page, pageSize, aggregates });
  } catch (e) {
    console.error('Error fetching students:', e);
    return res.status(500).json({ message: 'Failed to fetch students' });
  }
});

// Export students in various formats
// helper to send export in requested format using the provided rows
async function sendExport(rows: any[], format: string, res: any) {
  try {
    if (format === 'xlsx') {
      try {
        const ExcelJS = require('exceljs');
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Students');
        ws.addRow(['StudentId', 'FirstName', 'LastName', 'Email', 'Phone', 'Program', 'Department', 'Level', 'Session', 'TuitionStatus']);
        for (const s of rows) {
          const prog = (s.program && (s.program as any).name) ? (s.program as any).name : String(s.program || '');
          const dept = (s.department && (s.department as any).name) ? (s.department as any).name : String(s.department || '');
          ws.addRow([s.studentId || '', s.firstName || '', s.lastName || '', s.email || '', s.phoneNumber || '', prog, dept, String(s.level || ''), String(s.session || ''), String(s.tuitionStatus || '')]);
        }
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="students-export.xlsx"');
        await wb.xlsx.write(res);
        return res.end();
      } catch (e) {
  console.error('[students/export] xlsx generation error', e && ((e as any).stack || e));
        throw e;
      }
    }

    if (format === 'pdf') {
      try {
        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ size: 'A4', margin: 30 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="students-export.pdf"');
        doc.pipe(res);

        const margin = 30;
        const cols = [50, 150, 150, 80, 80, 25];
        const colX: number[] = [];
        let x = margin;
        for (const w of cols) { colX.push(x); x += w; }

        const rowHeight = 18;
        let y = margin;

        function drawHeader() {
          doc.fontSize(14).font('Helvetica-Bold').text('Students Export', margin, y, { align: 'left' });
          y += 20;
          doc.fontSize(10).font('Helvetica-Bold');
          const headerLabels = ['StudentId', 'Name', 'Email', 'Phone', 'Program', 'Status'];
          for (let i = 0; i < headerLabels.length; i++) {
            const hx = colX[i];
            const hw = cols[i];
            doc.rect(hx, y, hw, rowHeight).fill('#f3f4f6');
            doc.fillColor('#000').text(headerLabels[i], hx + 4, y + 4, { width: hw - 8, ellipsis: true });
          }
          y += rowHeight;
        }

        function newPage() { doc.addPage(); y = margin; drawHeader(); }
        drawHeader();

        doc.font('Helvetica').fontSize(9).fillColor('#000');
        for (const s of rows) {
          if (y + rowHeight > doc.page.height - margin) newPage();
          const prog = (s.program && (s.program as any).name) ? (s.program as any).name : String(s.program || '');
          const status = String(s.tuitionStatus || '');
          const values = [s.studentId || '', `${s.firstName || ''} ${s.lastName || ''}`, s.email || '', s.phoneNumber || '', prog, status];
          for (let i = 0; i < values.length; i++) {
            const vx = colX[i]; const vw = cols[i];
            doc.fillColor('#000').text(String(values[i]), vx + 4, y + 4, { width: vw - 8, continued: false });
          }
          y += rowHeight;
        }

        doc.end();
        return;
      } catch (e) {
  console.error('[students/export] pdf generation error', e && ((e as any).stack || e));
        throw e;
      }
    }

    // default CSV
    try {
      const header = ['StudentId', 'FirstName', 'LastName', 'Email', 'Phone', 'Program', 'Department', 'Level', 'Session', 'TuitionStatus'];
      const lines = [header.join(',')];
      for (const s of rows) {
        const prog = (s.program && (s.program as any).name) ? (s.program as any).name : String(s.program || '');
        const dept = (s.department && (s.department as any).name) ? (s.department as any).name : String(s.department || '');
        const fields = [s.studentId || '', s.firstName || '', s.lastName || '', s.email || '', s.phoneNumber || '', prog, dept, String(s.level || ''), String(s.session || ''), String(s.tuitionStatus || '')];
        const esc = fields.map(f => `"${String(f).replace(/"/g, '""')}"`);
        lines.push(esc.join(','));
      }
      const csv = lines.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="students-export.csv"');
      return res.send(csv);
    } catch (e) {
  console.error('[students/export] csv generation error', e && ((e as any).stack || e));
      throw e;
    }
  } catch (outerErr) {
    // Try CSV fallback when non-CSV formats fail to provide a usable file
    try {
      console.warn('[students/export] Export failed for format, attempting CSV fallback', (outerErr as any)?.message || outerErr);
      const header = ['StudentId', 'FirstName', 'LastName', 'Email', 'Phone', 'Program', 'Department', 'Level', 'Session', 'TuitionStatus'];
      const lines = [header.join(',')];
      for (const s of rows) {
        const prog = (s.program && (s.program as any).name) ? (s.program as any).name : String(s.program || '');
        const dept = (s.department && (s.department as any).name) ? (s.department as any).name : String(s.department || '');
        const fields = [s.studentId || '', s.firstName || '', s.lastName || '', s.email || '', s.phoneNumber || '', prog, dept, String(s.level || ''), String(s.session || ''), String(s.tuitionStatus || '')];
        const esc = fields.map(f => `"${String(f).replace(/"/g, '""')}"`);
        lines.push(esc.join(','));
      }
      const csv = lines.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="students-export-fallback.csv"');
      return res.send(csv);
    } catch (fallbackErr) {
      console.error('[students/export] CSV fallback also failed', (fallbackErr as any)?.stack || fallbackErr);
      throw outerErr;
    }
  }
}

// GET /export remains (keeps backward compatibility for direct links)
router.get('/export', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const format = String(req.query.format || 'csv').toLowerCase();
    const query: any = {};
    if (!(req.user && req.user.type === 'SuperAdmin')) {
      const branchId = String(req.query.branch || '');
      if (!branchId) return res.status(400).json({ message: 'branch query parameter is required' });
      query.branch = branchId;
    } else {
      if (req.query.branch) query.branch = String(req.query.branch);
    }
    const search = String(req.query.search || '').trim();
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'), 'i');
      query.$or = [ { firstName: re }, { lastName: re }, { email: re }, { studentId: re } ];
    }
    if (req.query.program) query.program = String(req.query.program);
    if (req.query.status) query.tuitionStatus = String(req.query.status);

  const rows = await Student.find(query).populate('program department branch').sort({ createdAt: -1 });
  // debug log: number of rows and request context
  // eslint-disable-next-line no-console
  console.log('[students/export] GET export request', { format, rows: rows.length, user: (req.user as any)?.email || (req.user as any)?.id || 'unknown', branch: query.branch || null });
  return await sendExport(rows, format, res);
  } catch (e) {
    // log error details for debugging
    // eslint-disable-next-line no-console
  console.error('[students/export] GET export error', e && ((e as any).stack || e));
    return res.status(500).json({ message: 'Failed to export students' });
  }
});

// POST /export - accept JSON body with filters and format. This allows authenticated fetch from frontend and download via blob.
router.post('/export', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const format = String(req.body.format || 'csv').toLowerCase();
    const query: any = {};
    if (!(req.user && req.user.type === 'SuperAdmin')) {
      const branchId = String(req.body.branch || '');
      if (!branchId) return res.status(400).json({ message: 'branch is required' });
      query.branch = branchId;
    } else {
      if (req.body.branch) query.branch = String(req.body.branch);
    }
    const search = String(req.body.search || '').trim();
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'), 'i');
      query.$or = [ { firstName: re }, { lastName: re }, { email: re }, { studentId: re } ];
    }
    if (req.body.program) query.program = String(req.body.program);
    if (req.body.status) query.tuitionStatus = String(req.body.status);
    // support exporting selected IDs (array of _id or studentId)
    if (req.body.ids && Array.isArray(req.body.ids) && req.body.ids.length) {
      const idsArr = (req.body.ids || []).map((x: any) => String(x));
      const objectIds: string[] = idsArr.filter((id: string) => mongoose.Types.ObjectId.isValid(id));
      const nonObjectIds: string[] = idsArr.filter((id: string) => !mongoose.Types.ObjectId.isValid(id));
      // debug incoming ids and classification
      // eslint-disable-next-line no-console
      console.debug('[students/export] POST received ids', { idsArr, objectIds, nonObjectIds });
      if (objectIds.length && nonObjectIds.length) {
        query.$or = [ ...(query.$or || []), { _id: { $in: objectIds } }, { studentId: { $in: nonObjectIds } } ];
      } else if (objectIds.length) {
        query._id = { $in: objectIds };
      } else {
        query.studentId = { $in: nonObjectIds };
      }
    }

    // log the final query for debugging
    // eslint-disable-next-line no-console
    console.debug('[students/export] POST computed query', JSON.stringify(query));

  const rows = await Student.find(query).populate('program department branch').sort({ createdAt: -1 });
  // debug log: number of rows and request context
  // eslint-disable-next-line no-console
  console.log('[students/export] POST export request', { format, rows: rows.length, user: (req.user as any)?.email || (req.user as any)?.id || 'unknown', branch: query.branch || null });
  return await sendExport(rows, format, res);
  } catch (e) {
    // eslint-disable-next-line no-console
  console.error('[students/export] POST export error', e && ((e as any).stack || e));
    return res.status(500).json({ message: 'Failed to export students' });
  }
});

router.post('/', authMiddleware, requirePermission('students'), requireBranchAccess(), async (req: AuthRequest, res) => {
  const {
    firstName, lastName, dateOfBirth, placeOfBirth, regionOfOrigin, phoneNumber, gender, email,
    program, department, guardian, emergencyContact, address, notes, academicYear, level, session
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
  if (!placeOfBirth) missing.push('placeOfBirth');
  if (!regionOfOrigin) missing.push('regionOfOrigin');
  if (!phoneNumber) missing.push('phoneNumber');
  if (!gender) missing.push('gender');
  if (!program) missing.push('program');
  if (!department) missing.push('department');
  if (!guardian || !guardian.name) missing.push('guardian.name');
  if (!academicYear) missing.push('academicYear');
  if (missing.length) return res.status(400).json({ message: 'Missing required fields', missing });

  // branch is required to attribute student to a branch
  const { branch } = req.body;
  if (!branch) return res.status(400).json({ message: 'branch is required and must be a valid branch id' });
  // debug: log incoming branch value to help diagnose validation failures
  try {
    // eslint-disable-next-line no-console
    console.log('[students] Incoming branch raw:', branch, 'type:', typeof branch, 'len:', (branch && String(branch).length) || 0);
    const asStr = String(branch || '');
    // eslint-disable-next-line no-console
    console.log('[students] branch matches 24-hex?', /^[0-9a-fA-F]{24}$/.test(asStr));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[students] Error while logging incoming branch value', e);
  }
  // normalize/coerce branch value into a candidate ObjectId string
  let branchCandidate = '';
  if (typeof branch === 'string') branchCandidate = branch;
  else if (branch && typeof branch === 'object') {
    // accept nested ids
    branchCandidate = String((branch as any)._id || (branch as any).id || branch);
  } else {
    branchCandidate = String(branch || '');
  }

  // if branchCandidate is not a valid ObjectId, try to extract a 24-hex substring
  if (!mongoose.Types.ObjectId.isValid(branchCandidate)) {
    const m = String(branchCandidate).match(/[0-9a-fA-F]{24}/);
    if (m) {
      // eslint-disable-next-line no-console
      console.log('[students] Coerced branch id from payload to', m[0]);
      branchCandidate = m[0];
    }
  }

  // quick sanity-check: ensure branch looks like a Mongo ObjectId
  if (!mongoose.Types.ObjectId.isValid(String(branchCandidate))) {
    return res.status(400).json({ message: 'Invalid branch id' });
  }

  // validate branch exists
  try {
  const b = await BranchModel.findById(branchCandidate);
    if (!b) return res.status(400).json({ message: 'Provided branch does not exist' });
    // If the user is not SuperAdmin, ensure they are assigning to a branch they manage.
    if (req.user && req.user.type !== 'SuperAdmin') {
  const mgrId = (b.manager as any)?._id || (b.manager as any) || '';
      if (!req.user.id || String(req.user.id) !== String(mgrId)) {
        return res.status(403).json({ message: 'You are not allowed to assign students to this branch' });
      }
    }
  } catch (e) {
  // Log the error to help diagnose why branch lookup failed
  // eslint-disable-next-line no-console
  console.error('[students] Branch lookup error for id=', branch, (e && (e as any).message) ? (e as any).message : String(e));
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

  const studentData = { 
    ...req.body,
    createdBy: req.user?.id,
    branch: req.body.branch
  };
  
  // ensure profilePicture is a URL if provided
  if (studentData.profilePicture && typeof studentData.profilePicture !== 'string') {
    delete studentData.profilePicture;
  }

  const student = new Student(studentData);
  try {
    await student.save();
    
    // Update branch student count
    await BranchModel.findByIdAndUpdate(branch, { $inc: { studentCount: 1 } });
    
    try { emitEvent('student.created', { id: student._id, student }); } catch (e) {}
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

router.get('/:id', authMiddleware, requirePermission('students'), requireBranchAccess(), async (req: AuthRequest, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('program department branch createdBy lastModifiedBy');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    
    // Branch access is handled by requireBranchAccess middleware
    res.json(student);
  } catch (e) {
    console.error('Error fetching student:', e);
    return res.status(500).json({ message: 'Failed to fetch student' });
  }
});

router.put('/:id', authMiddleware, requirePermission('students'), requireBranchAccess(), async (req: AuthRequest, res) => {
  try {
    const {
      firstName, lastName, dateOfBirth, placeOfBirth, regionOfOrigin, phoneNumber, gender, email,
      program, department, guardian, emergencyContact, address, notes, academicYear, level, session,
      tuitionStatus, enrollmentStatus, isActive
    } = req.body;
    
    if (!firstName || !lastName || !dateOfBirth || !placeOfBirth || !regionOfOrigin || !phoneNumber || !gender || !guardian || !guardian.name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    if (!validateCameroonPhone(phoneNumber)) {
      return res.status(400).json({ message: 'Phone number must be either a 9-digit local number (e.g. 652278121) or an international +237 number (e.g. +237652278121)' });
    }

    const updateData = { 
      ...req.body,
      lastModifiedBy: req.user?.id
    };
    
    if (updateData.profilePicture && typeof updateData.profilePicture !== 'string') {
      delete updateData.profilePicture;
    }

    const student = await Student.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('program department branch createdBy lastModifiedBy');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    try { emitEvent('student.updated', { id: student._id, student }); } catch (e) {}
    res.json(student);
  } catch (e) {
    console.error('Error updating student:', e);
    return res.status(500).json({ message: 'Failed to update student' });
  }
});

router.delete('/:id', authMiddleware, requirePermission('students'), requireBranchAccess(), async (req: AuthRequest, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Soft delete - set isActive to false instead of hard delete
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id, 
      { isActive: false, lastModifiedBy: req.user?.id }, 
      { new: true }
    );
    
    // Update branch student count
    if (student.branch) {
      await BranchModel.findByIdAndUpdate(student.branch, { $inc: { studentCount: -1 } });
    }
    
    try { emitEvent('student.deleted', { id: req.params.id, student: updatedStudent }); } catch (e) {}
    res.status(200).json({ message: 'Student deactivated successfully' });
  } catch (e) {
    console.error('Error deleting student:', e);
    return res.status(500).json({ message: 'Failed to delete student' });
  }
});

// Get student statistics
router.get('/stats/overview', authMiddleware, requirePermission('students'), requireBranchAccess(), async (req: AuthRequest, res) => {
  try {
    const query: any = {};
    
    // Branch filtering is handled by requireBranchAccess middleware
    if (req.query.branch) {
      query.branch = String(req.query.branch);
    }

    const [
      totalStudents,
      activeStudents,
      suspendedStudents,
      graduatedStudents,
      withdrawnStudents,
      paidStudents,
      partialStudents,
      pendingStudents,
      overdueStudents,
      studentsByGender,
      studentsByProgram
    ] = await Promise.all([
      Student.countDocuments(query),
      Student.countDocuments({ ...query, isActive: true, enrollmentStatus: 'Active' }),
      Student.countDocuments({ ...query, enrollmentStatus: 'Suspended' }),
      Student.countDocuments({ ...query, enrollmentStatus: 'Graduated' }),
      Student.countDocuments({ ...query, enrollmentStatus: 'Withdrawn' }),
      Student.countDocuments({ ...query, tuitionStatus: 'Paid' }),
      Student.countDocuments({ ...query, tuitionStatus: 'Partial' }),
      Student.countDocuments({ ...query, tuitionStatus: 'Pending' }),
      Student.countDocuments({ ...query, tuitionStatus: 'Overdue' }),
      Student.aggregate([
        { $match: query },
        { $group: { _id: '$gender', count: { $sum: 1 } } }
      ]),
      Student.aggregate([
        { $match: query },
        { $lookup: { from: 'programs', localField: 'program', foreignField: '_id', as: 'programInfo' } },
        { $unwind: '$programInfo' },
        { $group: { _id: '$programInfo.name', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    const stats = {
      total: totalStudents,
      enrollment: {
        active: activeStudents,
        suspended: suspendedStudents,
        graduated: graduatedStudents,
        withdrawn: withdrawnStudents
      },
      tuition: {
        paid: paidStudents,
        partial: partialStudents,
        pending: pendingStudents,
        overdue: overdueStudents
      },
      byGender: studentsByGender,
      byProgram: studentsByProgram
    };

    res.json(stats);
  } catch (e) {
    console.error('Error fetching student statistics:', e);
    return res.status(500).json({ message: 'Failed to fetch student statistics' });
  }
});

export default router;
