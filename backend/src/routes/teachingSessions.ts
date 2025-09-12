import express from 'express';
import TeachingSession from '../models/TeachingSession';
import StaffMember from '../models/StaffMember';
import Course from '../models/Course';
import { authMiddleware, requirePermission, AuthRequest } from '../middleware/auth';
import { emitEvent } from '../lib/events';
import mongoose from 'mongoose';

const router = express.Router();

// Get teaching sessions with filtering
router.get('/', authMiddleware, requirePermission('staff'), async (req: AuthRequest, res) => {
  try {
    const { lecturer, course, month, year, status, page = '1', limit = '20' } = req.query;
    const filter: any = {};
    
    if (lecturer) filter.lecturer = lecturer;
    if (course) filter.course = course;
    if (status) filter.status = status;
    
    if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0);
      filter.date = { $gte: startDate, $lte: endDate };
    }
    
    // Branch filtering
    if (!req.user?.isSuperAdmin && req.user?.branch) {
      filter.branch = req.user.branch;
    }
    
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.max(1, parseInt(limit as string));
    const skip = (pageNum - 1) * limitNum;
    
    const [sessions, total] = await Promise.all([
      TeachingSession.find(filter)
        .populate('lecturer', 'names employeeId hourlyRate')
        .populate('course', 'code title')
        .populate('approvedBy', 'name')
        .sort({ date: -1, startTime: 1 })
        .skip(skip)
        .limit(limitNum),
      TeachingSession.countDocuments(filter)
    ]);
    
    res.json({ data: sessions, meta: { total, page: pageNum, limit: limitNum } });
  } catch (err: any) {
    console.error('GET /api/teaching-sessions error', err);
    res.status(500).json({ error: { message: 'Failed to fetch teaching sessions' } });
  }
});

// Create teaching session
router.post('/', authMiddleware, requirePermission('staff'), async (req: AuthRequest, res) => {
  try {
    const { lecturer, course, date, startTime, endTime, notes } = req.body;
    
    if (!lecturer || !course || !date || !startTime || !endTime) {
      return res.status(400).json({ error: { message: 'Missing required fields' } });
    }
    
    // Verify lecturer exists and is active
    const lecturerDoc = await StaffMember.findById(lecturer);
    if (!lecturerDoc || !lecturerDoc.isActive || lecturerDoc.type !== 'Lecturer') {
      return res.status(400).json({ error: { message: 'Invalid or inactive lecturer' } });
    }
    
    // Verify course exists
    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      return res.status(400).json({ error: { message: 'Invalid course' } });
    }
    
    // Check for overlapping sessions
    const sessionDate = new Date(date);
    const existingSession = await TeachingSession.findOne({
      lecturer,
      date: sessionDate,
      $or: [
        {
          startTime: { $lte: startTime },
          endTime: { $gt: startTime }
        },
        {
          startTime: { $lt: endTime },
          endTime: { $gte: endTime }
        },
        {
          startTime: { $gte: startTime },
          endTime: { $lte: endTime }
        }
      ]
    });
    
    if (existingSession) {
      return res.status(400).json({ error: { message: 'Lecturer has overlapping session at this time' } });
    }
    
    const session = new TeachingSession({
      lecturer,
      course,
      date: sessionDate,
      startTime,
      endTime,
      notes,
      branch: req.user?.branch || lecturerDoc.branch
    });
    
    await session.save();
    
    const populatedSession = await TeachingSession.findById(session._id)
      .populate('lecturer', 'names employeeId hourlyRate')
      .populate('course', 'code title');
    
    try {
      emitEvent(session.branch.toString(), 'teaching.session.created', { session: populatedSession });
    } catch (e) {}
    
    res.status(201).json({ data: populatedSession });
  } catch (err: any) {
    console.error('POST /api/teaching-sessions error', err);
    res.status(500).json({ error: { message: 'Failed to create teaching session' } });
  }
});

// Get single teaching session
router.get('/:id', authMiddleware, requirePermission('staff'), async (req: AuthRequest, res) => {
  try {
    const session = await TeachingSession.findById(req.params.id)
      .populate('lecturer', 'names employeeId hourlyRate department')
      .populate('course', 'code title department')
      .populate('approvedBy', 'name');
    
    if (!session) {
      return res.status(404).json({ error: { message: 'Teaching session not found' } });
    }
    
    res.json({ data: session });
  } catch (err: any) {
    console.error('GET /api/teaching-sessions/:id error', err);
    res.status(500).json({ error: { message: 'Failed to fetch teaching session' } });
  }
});

// Update teaching session
router.put('/:id', authMiddleware, requirePermission('staff'), async (req: AuthRequest, res) => {
  try {
    const session = await TeachingSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: { message: 'Teaching session not found' } });
    }
    
    if (session.status !== 'pending') {
      return res.status(400).json({ error: { message: 'Can only edit pending sessions' } });
    }
    
    const updates = req.body;
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;
    
    const updatedSession = await TeachingSession.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('lecturer', 'names employeeId').populate('course', 'code title');
    
    res.json({ data: updatedSession });
  } catch (err: any) {
    console.error('PUT /api/teaching-sessions/:id error', err);
    res.status(500).json({ error: { message: 'Failed to update teaching session' } });
  }
});

// Approve teaching session
router.post('/:id/approve', authMiddleware, requirePermission('staff'), async (req: AuthRequest, res) => {
  try {
    const session = await TeachingSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: { message: 'Teaching session not found' } });
    }
    
    if (session.status !== 'pending') {
      return res.status(400).json({ error: { message: 'Can only approve pending sessions' } });
    }
    
    session.status = 'approved';
    session.approvedBy = new mongoose.Types.ObjectId(req.user!.id);
    session.approvedAt = new Date();
    
    await session.save();
    
    const populatedSession = await TeachingSession.findById(session._id)
      .populate('lecturer', 'names employeeId hourlyRate')
      .populate('course', 'code title')
      .populate('approvedBy', 'name');
    
    try {
      emitEvent(session.branch.toString(), 'teaching.session.approved', { session: populatedSession });
    } catch (e) {}
    
    res.json({ data: populatedSession });
  } catch (err: any) {
    console.error('POST /api/teaching-sessions/:id/approve error', err);
    res.status(500).json({ error: { message: 'Failed to approve teaching session' } });
  }
});

// Reject teaching session
router.post('/:id/reject', authMiddleware, requirePermission('staff'), async (req: AuthRequest, res) => {
  try {
    const { reason } = req.body;
    
    const session = await TeachingSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: { message: 'Teaching session not found' } });
    }
    
    if (session.status !== 'pending') {
      return res.status(400).json({ error: { message: 'Can only reject pending sessions' } });
    }
    
    session.status = 'rejected';
    session.notes = reason || session.notes;
    
    await session.save();
    
    const populatedSession = await TeachingSession.findById(session._id)
      .populate('lecturer', 'names employeeId')
      .populate('course', 'code title');
    
    try {
      emitEvent(session.branch.toString(), 'teaching.session.rejected', { session: populatedSession });
    } catch (e) {}
    
    res.json({ data: populatedSession });
  } catch (err: any) {
    console.error('POST /api/teaching-sessions/:id/reject error', err);
    res.status(500).json({ error: { message: 'Failed to reject teaching session' } });
  }
});

// Delete teaching session
router.delete('/:id', authMiddleware, requirePermission('staff'), async (req: AuthRequest, res) => {
  try {
    const session = await TeachingSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: { message: 'Teaching session not found' } });
    }
    
    if (session.status === 'approved') {
      return res.status(400).json({ error: { message: 'Cannot delete approved sessions' } });
    }
    
    await TeachingSession.findByIdAndDelete(req.params.id);
    
    try {
      emitEvent(session.branch.toString(), 'teaching.session.deleted', { sessionId: req.params.id });
    } catch (e) {}
    
    res.json({ message: 'Teaching session deleted successfully' });
  } catch (err: any) {
    console.error('DELETE /api/teaching-sessions/:id error', err);
    res.status(500).json({ error: { message: 'Failed to delete teaching session' } });
  }
});

// Get lecturer's monthly hours summary
router.get('/lecturer/:lecturerId/summary', authMiddleware, requirePermission('staff'), async (req: AuthRequest, res) => {
  try {
    const { lecturerId } = req.params;
    const { month, year } = req.query;
    
    const currentMonth = month ? Number(month) : new Date().getMonth() + 1;
    const currentYear = year ? Number(year) : new Date().getFullYear();
    
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0);
    
    const sessions = await TeachingSession.find({
      lecturer: lecturerId,
      date: { $gte: startDate, $lte: endDate }
    }).populate('course', 'code title');
    
    const approvedSessions = sessions.filter(s => s.status === 'approved');
    const pendingSessions = sessions.filter(s => s.status === 'pending');
    const totalHours = approvedSessions.reduce((sum, s) => sum + s.hoursWorked, 0);
    const pendingHours = pendingSessions.reduce((sum, s) => sum + s.hoursWorked, 0);
    
    // Get lecturer's hourly rate
    const lecturer = await StaffMember.findById(lecturerId);
    const hourlyRate = lecturer?.hourlyRate || 0;
    const estimatedSalary = totalHours * hourlyRate;
    
    res.json({
      data: {
        totalHours,
        pendingHours,
        approvedSessions: approvedSessions.length,
        pendingSessions: pendingSessions.length,
        hourlyRate,
        estimatedSalary,
        sessions: sessions.map(s => ({
          _id: s._id,
          course: s.course,
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
          hoursWorked: s.hoursWorked,
          status: s.status
        }))
      }
    });
  } catch (err: any) {
    console.error('GET /api/teaching-sessions/lecturer/:lecturerId/summary error', err);
    res.status(500).json({ error: { message: 'Failed to fetch lecturer summary' } });
  }
});

export default router;