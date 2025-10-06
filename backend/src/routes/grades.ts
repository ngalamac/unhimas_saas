import express from 'express';
import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import Grade, { gradingScale } from '../models/Grade';
import Course from '../models/Course';
import Student from '../models/Student';
import authMiddleware, { AuthRequest, requirePermission, requireBranchAccess } from '../middleware/auth';

const router = express.Router();

// Create a new grade
router.post('/', authMiddleware, requirePermission('academics:create'), async (req: AuthRequest, res) => {
    try {
        const { student, course, semester, academicYear, caScore, examScore } = req.body || {};
        const errors: string[] = [];
        if (!student) errors.push('student is required');
        if (!course) errors.push('course is required');
        if (semester === undefined || isNaN(Number(semester))) errors.push('semester is required');
        if (!academicYear || typeof academicYear !== 'string') errors.push('academicYear is required');
        if (caScore === undefined || isNaN(Number(caScore))) errors.push('caScore is required');
        if (examScore === undefined || isNaN(Number(examScore))) errors.push('examScore is required');
        if (errors.length) return res.status(400).json({ error: { message: 'Validation error', details: errors } });

        // Branch isolation: ensure creator can only grade students from their branch (unless SuperAdmin)
        const studentDoc = await Student.findById(student).select('branch');
        if (!studentDoc) return res.status(400).json({ error: { message: 'Invalid student ID' } });
        if (!req.user?.isSuperAdmin && req.user?.branch && String(studentDoc.branch) !== String(req.user.branch)) {
            return res.status(403).json({ error: { message: 'Access denied: Branch mismatch' } });
        }

        const courseDoc = await Course.findById(course);
        if (!courseDoc) {
            return res.status(400).json({ error: { message: 'Invalid course ID' } });
        }

        const caW = Math.max(0, Math.min(1, Number(courseDoc.caWeight || 0.3)));
        const exW = Math.max(0, Math.min(1, Number(courseDoc.examWeight || 0.7)));
        const totalScore = Number(caScore) * caW + Number(examScore) * exW;

        let letterGrade: keyof typeof gradingScale = 'F';
        let gradePoints = 0.0;

        if (totalScore >= 80) {
            letterGrade = 'A';
            gradePoints = 4.0;
        } else if (totalScore >= 70) {
            letterGrade = 'B+';
            gradePoints = 3.5;
        } else if (totalScore >= 60) {
            letterGrade = 'B';
            gradePoints = 3.0;
        } else if (totalScore >= 55) {
            letterGrade = 'C+';
            gradePoints = 2.5;
        } else if (totalScore >= 50) {
            letterGrade = 'C';
            gradePoints = 2.0;
        } else if (totalScore >= 45) {
            letterGrade = 'D+';
            gradePoints = 1.5;
        } else if (totalScore >= 40) {
            letterGrade = 'D';
            gradePoints = 1.0;
        }

        const grade = new Grade({
            student,
            course,
            semester,
            academicYear,
            caScore,
            examScore,
            totalScore,
            letterGrade,
            gradePoints,
            createdBy: req.user?.id,
        });

        await grade.save();
        res.status(201).json({ data: grade });

    } catch (err: any) {
        console.error('POST /api/grades error', err);
        res.status(500).json({ error: { message: 'Failed to create grade', details: err.message } });
    }
});

// Get all grades
router.get('/', authMiddleware, requirePermission('academics'), async (req: AuthRequest, res) => {
    try {
        const { student, course, academicYear, semester } = req.query as any;
        const isSuper = !!req.user?.isSuperAdmin;
        if (isSuper) {
          const filter: any = {};
          if (student) filter.student = student;
          if (course) filter.course = course;
          if (academicYear) filter.academicYear = academicYear;
          if (semester) filter.semester = semester;
          const grades = await Grade.find(filter).populate('student course createdBy');
          return res.json({ data: grades });
        }

        // Non-superadmin: restrict to user's branch by joining students
        const pipeline: any[] = [];
        const match: any = {};
        if (student) match.student = new mongoose.Types.ObjectId(String(student));
        if (course) match.course = new mongoose.Types.ObjectId(String(course));
        if (academicYear) match.academicYear = String(academicYear);
        if (semester) match.semester = Number(semester);
        if (Object.keys(match).length) pipeline.push({ $match: match });
        pipeline.push(
          { $lookup: { from: 'students', localField: 'student', foreignField: '_id', as: 'studentInfo' } },
          { $unwind: '$studentInfo' },
          { $match: { 'studentInfo.branch': new mongoose.Types.ObjectId(String(req.user!.branch)) } },
          { $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'course' } },
          { $unwind: '$course' }
        );
        const results = await (Grade as any).aggregate(pipeline);
        return res.json({ data: results });
    } catch (err: any) {
        console.error('GET /api/grades error', err);
        res.status(500).json({ error: { message: 'Failed to fetch grades', details: err.message } });
    }
});

// Get a single grade
router.get('/:id', authMiddleware, requirePermission('academics'), async (req, res) => {
    try {
        const grade = await Grade.findById(req.params.id).populate('student course createdBy');
        if (!grade) {
            return res.status(404).json({ error: { message: 'Grade not found' } });
        }
        res.json({ data: grade });
    } catch (err: any) {
        console.error('GET /api/grades/:id error', err);
        res.status(500).json({ error: { message: 'Failed to fetch grade', details: err.message } });
    }
});

// Update a grade
router.put('/:id', authMiddleware, requirePermission('academics:edit'), async (req, res) => {
    try {
        const { caScore, examScore } = req.body;
        const grade = await Grade.findById(req.params.id).populate('course');
        if (!grade) {
            return res.status(404).json({ error: { message: 'Grade not found' } });
        }

        const courseDoc = grade.course as any;
        const totalScore = (caScore || grade.caScore) * (courseDoc.caWeight || 0.3) + (examScore || grade.examScore) * (courseDoc.examWeight || 0.7);

        let letterGrade: keyof typeof gradingScale = 'F';
        let gradePoints = 0.0;

        if (totalScore >= 80) {
            letterGrade = 'A';
            gradePoints = 4.0;
        } else if (totalScore >= 70) {
            letterGrade = 'B+';
            gradePoints = 3.5;
        } else if (totalScore >= 60) {
            letterGrade = 'B';
            gradePoints = 3.0;
        } else if (totalScore >= 55) {
            letterGrade = 'C+';
            gradePoints = 2.5;
        } else if (totalScore >= 50) {
            letterGrade = 'C';
            gradePoints = 2.0;
        } else if (totalScore >= 45) {
            letterGrade = 'D+';
            gradePoints = 1.5;
        } else if (totalScore >= 40) {
            letterGrade = 'D';
            gradePoints = 1.0;
        }

        grade.caScore = caScore || grade.caScore;
        grade.examScore = examScore || grade.examScore;
        grade.totalScore = totalScore;
        grade.letterGrade = letterGrade;
        grade.gradePoints = gradePoints;

        await grade.save();
        res.json({ data: grade });

    } catch (err: any) {
        console.error('PUT /api/grades/:id error', err);
        res.status(500).json({ error: { message: 'Failed to update grade', details: err.message } });
    }
});

// Delete a grade
router.delete('/:id', authMiddleware, requirePermission('academics:delete'), async (req, res) => {
    try {
        const grade = await Grade.findByIdAndDelete(req.params.id);
        if (!grade) {
            return res.status(404).json({ error: { message: 'Grade not found' } });
        }
        res.json({ message: 'Grade deleted successfully' });
    } catch (err: any) {
        console.error('DELETE /api/grades/:id error', err);
        res.status(500).json({ error: { message: 'Failed to delete grade', details: err.message } });
    }
});

export default router;
 
// Program performance summary: average GPA and pass rate per program
// GET /api/grades/reports/program-performance
router.get('/reports/program-performance', authMiddleware, requirePermission(['grades','grades:read','programs:read']), async (req: AuthRequest, res) => {
  try {
    // Aggregate grades by course -> program, compute average gradePoints and pass rate (C or better)
    const pipeline: any[] = [
      // branch isolation via student join
      { $lookup: { from: 'students', localField: 'student', foreignField: '_id', as: 'studentInfo' } },
      { $unwind: '$studentInfo' },
      ...(req.user && !req.user.isSuperAdmin && req.user.branch ? [{ $match: { 'studentInfo.branch': new mongoose.Types.ObjectId(String(req.user.branch)) } }] : []),
      { $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'courseInfo' } },
      { $unwind: '$courseInfo' },
      { $lookup: { from: 'programs', localField: 'courseInfo.program', foreignField: '_id', as: 'programInfo' } },
      { $unwind: '$programInfo' },
      {
        $group: {
          _id: '$programInfo._id',
          programName: { $first: '$programInfo.name' },
          programType: { $first: '$programInfo.type' },
          count: { $sum: 1 },
          avgGpa: { $avg: '$gradePoints' },
          passCount: { $sum: { $cond: [ { $gte: ['$gradePoints', 2.0] }, 1, 0 ] } }
        }
      },
      { $sort: { avgGpa: -1 } },
      { $limit: 50 }
    ];
    const results = await Grade.aggregate(pipeline);
    const mapped = results.map((r: any) => ({
      programId: r._id,
      name: r.programName,
      type: r.programType,
      count: r.count,
      avgGpa: Number((r.avgGpa || 0).toFixed(2)),
      passRate: r.count > 0 ? Number(((r.passCount / r.count) * 100).toFixed(1)) : 0
    }));
    res.json({ data: mapped });
  } catch (err: any) {
    console.error('GET /api/grades/reports/program-performance error', err);
    res.status(500).json({ error: { message: 'Failed to compute program performance', details: err?.message } });
  }
});

// Program performance with filters and detailed grade distribution
// GET /api/grades/reports/program-performance/detailed?from=YYYY-MM-DD&to=YYYY-MM-DD&program=ID
router.get('/reports/program-performance/detailed', authMiddleware, requirePermission(['grades','grades:read','programs:read']), async (req: AuthRequest, res) => {
  try {
    const { from, to, program } = req.query as any;
    const match: any = {};
    if (from || to) {
      match.createdAt = {} as any;
      if (from) match.createdAt.$gte = new Date(from);
      if (to) match.createdAt.$lte = new Date(to);
    }

    const pipeline: any[] = [
      { $match: match },
      { $lookup: { from: 'students', localField: 'student', foreignField: '_id', as: 'studentInfo' } },
      { $unwind: '$studentInfo' },
      ...(req.user && !req.user.isSuperAdmin && req.user.branch ? [{ $match: { 'studentInfo.branch': new mongoose.Types.ObjectId(String(req.user.branch)) } }] : []),
      { $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'courseInfo' } },
      { $unwind: '$courseInfo' },
      { $lookup: { from: 'programs', localField: 'courseInfo.program', foreignField: '_id', as: 'programInfo' } },
      { $unwind: '$programInfo' },
    ];
    if (program && mongoose.Types.ObjectId.isValid(String(program))) {
      pipeline.push({ $match: { 'programInfo._id': new mongoose.Types.ObjectId(String(program)) } });
    }
    pipeline.push(
      {
        $group: {
          _id: '$programInfo._id',
          programName: { $first: '$programInfo.name' },
          count: { $sum: 1 },
          avgGpa: { $avg: '$gradePoints' },
          passCount: { $sum: { $cond: [ { $gte: ['$gradePoints', 2.0] }, 1, 0 ] } },
          distribution: {
            $push: '$letterGrade'
          }
        }
      }
    );

    const results = await Grade.aggregate(pipeline);
    const mapped = results.map((r: any) => {
      const letterBuckets = ['A','B+','B','C+','C','D+','D','F'];
      const distMap: Record<string, number> = Object.create(null);
      for (const l of letterBuckets) distMap[l] = 0;
      for (const l of r.distribution || []) {
        if (typeof l === 'string' && distMap.hasOwnProperty(l)) distMap[l] += 1;
      }
      const count = r.count || 0;
      const breakdown = letterBuckets.map(l => ({ letter: l, count: distMap[l], pct: count > 0 ? +( (distMap[l] / count) * 100 ).toFixed(1) : 0 }));
      return {
        programId: r._id,
        name: r.programName,
        count,
        avgGpa: Number((r.avgGpa || 0).toFixed(2)),
        passRate: count > 0 ? Number(((r.passCount / count) * 100).toFixed(1)) : 0,
        breakdown
      };
    });
    res.json({ data: mapped });
  } catch (err: any) {
    console.error('GET /api/grades/reports/program-performance/detailed error', err);
    res.status(500).json({ error: { message: 'Failed to compute detailed performance', details: err?.message } });
  }
});

// Export program performance with optional filters to CSV or XLSX
// GET /api/grades/reports/program-performance/export?format=csv|xlsx&from=&to=&program=
router.get('/reports/program-performance/export', authMiddleware, requirePermission(['grades','grades:read','programs:read']), async (req: AuthRequest, res) => {
  try {
    const { format = 'csv', from, to, program } = req.query as any;
    const match: any = {};
    if (from || to) {
      match.createdAt = {} as any;
      if (from) match.createdAt.$gte = new Date(from);
      if (to) match.createdAt.$lte = new Date(to);
    }

    const pipeline: any[] = [
      { $match: match },
      { $lookup: { from: 'students', localField: 'student', foreignField: '_id', as: 'studentInfo' } },
      { $unwind: '$studentInfo' },
      ...(req.user && !req.user.isSuperAdmin && req.user.branch ? [{ $match: { 'studentInfo.branch': new mongoose.Types.ObjectId(String(req.user.branch)) } }] : []),
      { $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'courseInfo' } },
      { $unwind: '$courseInfo' },
      { $lookup: { from: 'programs', localField: 'courseInfo.program', foreignField: '_id', as: 'programInfo' } },
      { $unwind: '$programInfo' },
    ];
    if (program && mongoose.Types.ObjectId.isValid(String(program))) {
      pipeline.push({ $match: { 'programInfo._id': new mongoose.Types.ObjectId(String(program)) } });
    }
    pipeline.push({
      $group: {
        _id: '$programInfo._id',
        programName: { $first: '$programInfo.name' },
        count: { $sum: 1 },
        avgGpa: { $avg: '$gradePoints' },
        passCount: { $sum: { $cond: [ { $gte: ['$gradePoints', 2.0] }, 1, 0 ] } },
        distribution: { $push: '$letterGrade' }
      }
    });

    const results = await Grade.aggregate(pipeline);
    const letterBuckets = ['A','B+','B','C+','C','D+','D','F'];
    const rows = results.map((r: any) => {
      const distMap: Record<string, number> = Object.create(null);
      for (const l of letterBuckets) distMap[l] = 0;
      for (const l of r.distribution || []) { if (typeof l === 'string' && distMap.hasOwnProperty(l)) distMap[l] += 1; }
      const count = r.count || 0;
      const avgGpa = Number((r.avgGpa || 0).toFixed(2));
      const passRate = count > 0 ? Number(((r.passCount / count) * 100).toFixed(1)) : 0;
      return {
        program: r.programName,
        count,
        avgGpa,
        passRate,
        ...letterBuckets.reduce((acc: any, l) => { acc[l] = distMap[l]; return acc; }, {})
      };
    });

    if (String(format).toLowerCase() === 'xlsx') {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Program Performance');
      const header = ['Program','Count','AvgGPA','PassRate','A','B+','B','C+','C','D+','D','F'];
      ws.addRow(header);
      for (const r of rows) {
        ws.addRow([r.program, r.count, r.avgGpa, r.passRate, r['A'], r['B+'], r['B'], r['C+'], r['C'], r['D+'], r['D'], r['F']]);
      }
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="program-performance.xlsx"');
      await wb.xlsx.write(res as any);
      return res.end();
    }

    // CSV default
    const header = ['Program','Count','AvgGPA','PassRate','A','B+','B','C+','C','D+','D','F'];
    const lines = [header.join(',')];
    for (const r of rows) {
      const vals = [r.program, r.count, r.avgGpa, r.passRate, r['A'], r['B+'], r['B'], r['C+'], r['C'], r['D+'], r['D'], r['F']].map((v: any) => JSON.stringify(v ?? ''));
      lines.push(vals.join(','));
    }
    const csv = lines.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="program-performance.csv"');
    return res.send(csv);
  } catch (err: any) {
    console.error('GET /api/grades/reports/program-performance/export error', err);
    res.status(500).json({ error: { message: 'Failed to export program performance', details: err?.message } });
  }
});
