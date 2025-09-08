import express from 'express';
import Grade from '../models/Grade';
import { authMiddleware, requirePermission, AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

const router = express.Router();

// Bulk create/update grades for a course
router.post('/bulk', authMiddleware, requirePermission('grades.create'), async (req: AuthRequest, res) => {
    const { courseId, academicYear, semester, grades } = req.body;

    if (!courseId || !academicYear || !semester || !Array.isArray(grades)) {
        return res.status(400).json({ error: 'courseId, academicYear, semester, and a grades array are required.' });
    }

    const operations = grades.map(grade => {
        const { studentId, ca_mark, exam_mark } = grade;
        return {
            updateOne: {
                filter: {
                    student: new mongoose.Types.ObjectId(studentId),
                    course: new mongoose.Types.ObjectId(courseId),
                    academicYear,
                    semester
                },
                update: {
                    $set: { ca_mark, exam_mark, createdBy: req.user?.id }
                },
                upsert: true, // This will create the document if it doesn't exist
            }
        };
    });

    try {
        if (operations.length > 0) {
            await Grade.bulkWrite(operations);
        }
        res.status(200).json({ message: 'Grades updated successfully.' });
    } catch (err) {
        console.error('Bulk grade update error:', err);
        res.status(500).json({ error: 'Failed to update grades.' });
    }
});

// Get all grades for a specific student
router.get('/student/:studentId', authMiddleware, requirePermission('grades.read'), async (req, res) => {
    try {
        const { studentId } = req.params;
        const grades = await Grade.find({ student: studentId })
            .populate({
                path: 'course',
                populate: {
                    path: 'specialty',
                    populate: {
                        path: 'department',
                        populate: {
                            path: 'program'
                        }
                    }
                }
            })
            .sort({ academicYear: 1, semester: 1 });

        res.json(grades);
    } catch (err) {
        console.error('Error fetching student grades:', err);
        res.status(500).json({ error: 'Failed to fetch student grades.' });
    }
});

// Get all grades for a specific course
router.get('/course/:courseId', authMiddleware, requirePermission('grades.read'), async (req, res) => {
    try {
        const { courseId } = req.params;
        const grades = await Grade.find({ course: courseId })
            .populate('student', 'firstName lastName studentId')
            .sort({ 'student.lastName': 1 });

        res.json(grades);
    } catch (err) {
        console.error('Error fetching course grades:', err);
        res.status(500).json({ error: 'Failed to fetch course grades.' });
    }
});

export default router;
