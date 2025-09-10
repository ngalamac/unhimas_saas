import express from 'express';
import { authMiddleware, requirePermission, AuthRequest } from '../middleware/auth';
import Student from '../models/Student';
import Branch from '../models/BranchModel';
import User from '../models/User';
import JournalEntry from '../models/JournalEntry';
import mongoose from 'mongoose';
import Program from '../models/Program';
import Department from '../models/Department';
import Specialty from '../models/Specialty';
import Course from '../models/Course';

const router = express.Router();

// SuperAdmin Dashboard Data Endpoint
router.get('/superadmin', authMiddleware, requirePermission('dashboard.superadmin'), async (req: AuthRequest, res) => {
    // Double-check for super admin, even though middleware should handle it.
    if (!req.user?.isSuperAdmin) {
        return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    try {
        // 1. Aggregate total students and income/expenses
        const [studentCount, financialSummary, branchCount, userCount] = await Promise.all([
            Student.countDocuments({ isActive: true }),
            JournalEntry.aggregate([
                { $unwind: '$lines' },
                {
                    $lookup: {
                        from: 'accounts',
                        localField: 'lines.account',
                        foreignField: '_id',
                        as: 'accountInfo'
                    }
                },
                { $unwind: '$accountInfo' },
                {
                    $group: {
                        _id: null,
                        totalIncome: { $sum: { $cond: [{ $eq: ['$accountInfo.type', 'income'] }, '$lines.credit', 0] } },
                        totalExpenses: { $sum: { $cond: [{ $eq: ['$accountInfo.type', 'expense'] }, '$lines.debit', 0] } },
                    }
                }
            ]),
            Branch.countDocuments({ isActive: true }),
            User.countDocuments({ isActive: true })
        ]);

        // 2. Get stats for each branch
        const branches = await Branch.find({ isActive: true }).lean();
        const branchStats = await Promise.all(
            branches.map(async (branch) => {
                const [students, staff] = await Promise.all([
                    Student.countDocuments({ branch: branch._id, isActive: true }),
                    User.countDocuments({ branch: branch._id, isActive: true })
                ]);
                return { ...branch, studentCount: students, staffCount: staff };
            })
        );

        const summary = {
            totalStudents: studentCount,
            totalIncome: financialSummary[0]?.totalIncome || 0,
            totalExpenses: financialSummary[0]?.totalExpenses || 0,
            totalBranches: branchCount,
            totalUsers: userCount,
            branches: branchStats,
        };

        res.json(summary);

    } catch (err) {
        console.error('SuperAdmin dashboard error:', err);
        res.status(500).json({ error: 'Failed to fetch dashboard data.' });
    }
});

// Admin (Branch Manager) Dashboard Data Endpoint
router.get('/admin', authMiddleware, requirePermission('dashboard.admin'), async (req: AuthRequest, res) => {
    const branchId = req.user?.branch;
    if (!branchId) {
        return res.status(400).json({ error: 'User is not associated with a branch.' });
    }

    try {
        const [studentCount, staffCount, financialSummary] = await Promise.all([
            Student.countDocuments({ branch: branchId, isActive: true }),
            User.countDocuments({ branch: branchId, isActive: true }),
            JournalEntry.aggregate([
                { $match: { branch: new mongoose.Types.ObjectId(branchId) } },
                { $unwind: '$lines' },
                {
                    $lookup: {
                        from: 'accounts',
                        localField: 'lines.account',
                        foreignField: '_id',
                        as: 'accountInfo'
                    }
                },
                { $unwind: '$accountInfo' },
                {
                    $group: {
                        _id: null,
                        totalIncome: { $sum: { $cond: [{ $eq: ['$accountInfo.type', 'income'] }, '$lines.credit', 0] } },
                        totalExpenses: { $sum: { $cond: [{ $eq: ['$accountInfo.type', 'expense'] }, '$lines.debit', 0] } },
                    }
                }
            ])
        ]);

        const summary = {
            studentCount,
            staffCount,
            totalIncome: financialSummary[0]?.totalIncome || 0,
            totalExpenses: financialSummary[0]?.totalExpenses || 0,
        };

        res.json(summary);

    } catch (err) {
        console.error('Admin dashboard error:', err);
        res.status(500).json({ error: 'Failed to fetch dashboard data.' });
    }
});

// Accountant Dashboard Data Endpoint
router.get('/accountant', authMiddleware, requirePermission('dashboard.accountant'), async (req: AuthRequest, res) => {
    const branchId = req.user?.branch;
    if (!branchId) {
        return res.status(400).json({ error: 'User is not associated with a branch.' });
    }

    try {
        const [financialSummary, recentTransactions] = await Promise.all([
            JournalEntry.aggregate([
                { $match: { branch: new mongoose.Types.ObjectId(branchId) } },
                { $unwind: '$lines' },
                {
                    $lookup: {
                        from: 'accounts',
                        localField: 'lines.account',
                        foreignField: '_id',
                        as: 'accountInfo'
                    }
                },
                { $unwind: '$accountInfo' },
                {
                    $group: {
                        _id: null,
                        totalIncome: { $sum: { $cond: [{ $eq: ['$accountInfo.type', 'income'] }, '$lines.credit', 0] } },
                        totalExpenses: { $sum: { $cond: [{ $eq: ['$accountInfo.type', 'expense'] }, '$lines.debit', 0] } },
                    }
                }
            ]),
            // Fetch the 5 most recent journal entries for the branch
            JournalEntry.find({ branch: branchId })
                .sort({ date: -1 })
                .limit(5)
                .populate('postedBy', 'name')
        ]);

        const summary = {
            totalIncome: financialSummary[0]?.totalIncome || 0,
            totalExpenses: financialSummary[0]?.totalExpenses || 0,
            recentTransactions: recentTransactions,
        };

        res.json(summary);

    } catch (err) {
        console.error('Accountant dashboard error:', err);
        res.status(500).json({ error: 'Failed to fetch dashboard data.' });
    }
});

// Registrar Dashboard Data Endpoint
router.get('/registrar', authMiddleware, requirePermission('dashboard.registrar'), async (req: AuthRequest, res) => {
    const branchId = req.user?.branch;
    if (!branchId) {
        return res.status(400).json({ error: 'User is not associated with a branch.' });
    }

    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [totalStudents, newAdmissions, studentsByProgram, recentStudents] = await Promise.all([
            Student.countDocuments({ branch: branchId, isActive: true }),
            Student.countDocuments({ branch: branchId, isActive: true, admissionDate: { $gte: thirtyDaysAgo } }),
            Student.aggregate([
                { $match: { branch: new mongoose.Types.ObjectId(branchId), isActive: true } },
                { $group: { _id: '$program', count: { $sum: 1 } } },
                { $lookup: { from: 'programs', localField: '_id', foreignField: '_id', as: 'programInfo' } },
                { $unwind: '$programInfo' },
                { $project: { _id: 0, programName: '$programInfo.name', count: '$count' } }
            ]),
            Student.find({ branch: branchId }).sort({ admissionDate: -1 }).limit(5).populate('program specialty')
        ]);

        const summary = {
            totalStudents,
            newAdmissions,
            studentsByProgram,
            recentStudents
        };

        res.json(summary);

    } catch (err) {
        console.error('Registrar dashboard error:', err);
        res.status(500).json({ error: 'Failed to fetch dashboard data.' });
    }
});

// Dean of Studies Dashboard Data Endpoint
router.get('/dean', authMiddleware, requirePermission('dashboard.dean'), async (req: AuthRequest, res) => {
    const branchId = req.user?.branch;
    if (!branchId) {
        return res.status(400).json({ error: 'User is not associated with a branch.' });
    }

    try {
        // Now that branch is denormalized, these queries are much more efficient.
        const [programCount, departmentCount, specialtyCount, courseCount] = await Promise.all([
            Program.countDocuments({ branch: branchId }),
            Department.countDocuments({ branch: branchId }),
            Specialty.countDocuments({ branch: branchId }),
            Course.countDocuments({ branch: branchId })
        ]);

        const summary = {
            programCount,
            departmentCount,
            specialtyCount,
            courseCount
        };

        res.json(summary);

    } catch (err) {
        console.error('Dean dashboard error:', err);
        res.status(500).json({ error: 'Failed to fetch dashboard data.' });
    }
});

// HOD Dashboard Data Endpoint
router.get('/hod', authMiddleware, requirePermission('dashboard.hod'), async (req: AuthRequest, res) => {
    // Safely access the department ID from the authenticated user
    const departmentId = req.user?.department;

    // Check if the user is actually an HOD and has a department assigned
    if (req.user?.type !== 'Head Of Department' || !departmentId) {
        return res.status(403).json({ error: 'User is not a Head of Department or not associated with a department.' });
    }

    try {
        const [studentCount, courseCount, specialtyCount] = await Promise.all([
            Student.countDocuments({ department: departmentId, isActive: true }),
            Course.countDocuments({ department: departmentId }),
            Specialty.countDocuments({ department: departmentId })
        ]);

        const summary = {
            studentCount,
            courseCount,
            specialtyCount
        };

        res.json(summary);

    } catch (err) {
        console.error('HOD dashboard error:', err);
        res.status(500).json({ error: 'Failed to fetch dashboard data.' });
    }
});


export default router;
