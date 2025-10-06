import express from 'express';
import mongoose from 'mongoose';
import Grade, { gradingScale } from '../models/Grade';
import Course from '../models/Course';
import authMiddleware, { AuthRequest, requirePermission, requireBranchAccess } from '../middleware/auth';

const router = express.Router();

// Create a new grade
router.post('/', authMiddleware, requirePermission('academics:create'), async (req: AuthRequest, res) => {
    try {
        const { student, course, semester, academicYear, caScore, examScore } = req.body;

        if (!student || !course || !semester || !academicYear || caScore === undefined || examScore === undefined) {
            return res.status(400).json({ error: { message: 'Missing required fields' } });
        }

        const courseDoc = await Course.findById(course);
        if (!courseDoc) {
            return res.status(400).json({ error: { message: 'Invalid course ID' } });
        }

        const totalScore = caScore * (courseDoc.caWeight || 0.3) + examScore * (courseDoc.examWeight || 0.7);

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
router.get('/', authMiddleware, requirePermission('academics'), async (req, res) => {
    try {
        const { student, course, academicYear, semester } = req.query;
        const filter: any = {};
        if (student) filter.student = student;
        if (course) filter.course = course;
        if (academicYear) filter.academicYear = academicYear;
        if (semester) filter.semester = semester;

        const grades = await Grade.find(filter).populate('student course createdBy');
        res.json({ data: grades });
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
router.get('/reports/program-performance', authMiddleware, requirePermission(['grades','grades:read','programs:read']), async (_req: AuthRequest, res) => {
  try {
    // Aggregate grades by course -> program, compute average gradePoints and pass rate (C or better)
    const pipeline: any[] = [
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
