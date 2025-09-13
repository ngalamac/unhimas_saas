import express from 'express';
import StaffMember from '../models/StaffMember';
import TeachingSession from '../models/TeachingSession';
import PayrollPeriod from '../models/PayrollPeriod';
import PayrollEntry from '../models/PayrollEntry';
import OfficeTransaction from '../models/OfficeTransaction';
import { authMiddleware, requirePermission, AuthRequest } from '../middleware/auth';
import { emitEvent } from '../lib/events';
import mongoose from 'mongoose';

const router = express.Router();

// Get teaching sessions
router.get('/sessions', authMiddleware, requirePermission('staff'), async (req: AuthRequest, res) => {
  try {
    const { lecturer, course, month, year } = req.query;
    const filter: any = {};
    
    if (lecturer) filter.lecturer = lecturer;
    if (course) filter.course = course;
    if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0);
      filter.date = { $gte: startDate, $lte: endDate };
    }
    
    // Branch filtering
    if (!req.user?.isSuperAdmin && req.user?.branch) {
      filter.branch = req.user.branch;
    }
    
    const sessions = await TeachingSession.find(filter)
      .populate('lecturer', 'names employeeId')
      .populate('course', 'code title')
      .populate('approvedBy', 'name')
      .sort({ date: -1, startTime: 1 });
    
    res.json({ data: sessions });
  } catch (err: any) {
    console.error('GET /api/payroll/sessions error', err);
    res.status(500).json({ error: { message: 'Failed to fetch teaching sessions' } });
  }
});

// Create teaching session
router.post('/sessions', authMiddleware, requirePermission('staff'), async (req: AuthRequest, res) => {
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
    
    const session = new TeachingSession({
      lecturer,
      course,
      date: new Date(date),
      startTime,
      endTime,
      notes,
      branch: req.user?.branch || lecturerDoc.branch
    });
    
    await session.save();
    
    const populatedSession = await TeachingSession.findById(session._id)
      .populate('lecturer', 'names employeeId')
      .populate('course', 'code title');
    
    try {
      emitEvent(session.branch.toString(), 'teaching.session.created', { session: populatedSession });
    } catch (e) {}
    
    res.status(201).json({ data: populatedSession });
  } catch (err: any) {
    console.error('POST /api/payroll/sessions error', err);
    res.status(500).json({ error: { message: 'Failed to create teaching session' } });
  }
});

// Approve teaching session
router.post('/sessions/:id/approve', authMiddleware, requirePermission('staff'), async (req: AuthRequest, res) => {
  try {
    const session = await TeachingSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: { message: 'Teaching session not found' } });
    }
    
    session.status = 'approved';
    session.approvedBy = new mongoose.Types.ObjectId(req.user!.id);
    session.approvedAt = new Date();
    
    await session.save();
    
    const populatedSession = await TeachingSession.findById(session._id)
      .populate('lecturer', 'names employeeId')
      .populate('course', 'code title')
      .populate('approvedBy', 'name');
    
    try {
      emitEvent(session.branch.toString(), 'teaching.session.approved', { session: populatedSession });
    } catch (e) {}
    
    res.json({ data: populatedSession });
  } catch (err: any) {
    console.error('POST /api/payroll/sessions/:id/approve error', err);
    res.status(500).json({ error: { message: 'Failed to approve teaching session' } });
  }
});

// Get payroll periods
router.get('/periods', authMiddleware, requirePermission('staff'), async (req: AuthRequest, res) => {
  try {
    const filter: any = {};
    
    // Branch filtering
    if (!req.user?.isSuperAdmin && req.user?.branch) {
      filter.branch = req.user.branch;
    }
    
    const periods = await PayrollPeriod.find(filter)
      .populate('createdBy', 'name')
      .sort({ year: -1, month: -1 });
    
    res.json({ data: periods });
  } catch (err: any) {
    console.error('GET /api/payroll/periods error', err);
    res.status(500).json({ error: { message: 'Failed to fetch payroll periods' } });
  }
});

// Create payroll period
router.post('/periods', authMiddleware, requirePermission('staff'), async (req: AuthRequest, res) => {
  try {
    const { month, year, branch } = req.body;
    
    if (!month || !year || month < 1 || month > 12) {
      return res.status(400).json({ error: { message: 'Valid month (1-12) and year are required' } });
    }
    
    // Determine branch
    const branchId = req.user?.isSuperAdmin ? branch : req.user?.branch;
    if (!branchId) {
      return res.status(400).json({ error: { message: 'Branch is required' } });
    }
    
    // Check if period already exists
    const existing = await PayrollPeriod.findOne({ month, year, branch: branchId });
    if (existing) {
      return res.status(400).json({ error: { message: 'Payroll period already exists for this month' } });
    }
    
    // Calculate start and end dates
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const period = new PayrollPeriod({
      month,
      year,
      startDate,
      endDate,
      branch: branchId,
      createdBy: req.user?.id
    });
    
    await period.save();
    
    const populatedPeriod = await PayrollPeriod.findById(period._id)
      .populate('createdBy', 'name');
    
    res.status(201).json({ data: populatedPeriod });
  } catch (err: any) {
    console.error('POST /api/payroll/periods error', err);
    res.status(500).json({ error: { message: 'Failed to create payroll period' } });
  }
});

// Process payroll for a period
router.post('/periods/:id/process', authMiddleware, requirePermission('staff'), async (req: AuthRequest, res) => {
  try {
    const period = await PayrollPeriod.findById(req.params.id);
    if (!period) {
      return res.status(404).json({ error: { message: 'Payroll period not found' } });
    }
    
    if (period.status !== 'draft') {
      return res.status(400).json({ error: { message: 'Can only process draft payroll periods' } });
    }
    
    period.status = 'processing';
    await period.save();
    
    // Get all active staff for this branch
    const staff = await StaffMember.find({ 
      branch: period.branch, 
      isActive: true 
    });
    
    const payrollEntries = [];
    let totalAmount = 0;
    
    for (const staffMember of staff) {
      let hoursWorked = 0;
      let grossSalary = 0;
      
      if (staffMember.paymentType === 'hourly') {
        // Calculate hours from approved teaching sessions
        const sessions = await TeachingSession.find({
          lecturer: staffMember._id,
          status: 'approved',
          date: {
            $gte: period.startDate,
            $lte: period.endDate
          }
        });
        
        hoursWorked = sessions.reduce((total, session) => total + session.hoursWorked, 0);
        grossSalary = hoursWorked * staffMember.hourlyRate;
      } else {
        // Fixed salary
        grossSalary = staffMember.baseSalary || 0;
      }
      
      // Calculate deductions (simplified - 10% tax, 5% insurance)
      const tax = grossSalary * 0.10;
      const insurance = grossSalary * 0.05;
      const totalDeductions = tax + insurance;
      const netSalary = grossSalary - totalDeductions;
      
      const entry = new PayrollEntry({
        payrollPeriod: period._id,
        staff: staffMember._id,
        hoursWorked,
        hourlyRate: staffMember.hourlyRate,
        baseSalary: staffMember.baseSalary || 0,
        overtimeHours: 0,
        overtimeRate: 0,
        grossSalary,
        deductions: {
          tax,
          insurance,
          other: 0,
          total: totalDeductions
        },
        netSalary
      });
      
      await entry.save();
      payrollEntries.push(entry);
      totalAmount += netSalary;
    }
    
    // Update period
    period.status = 'completed';
    period.processedAt = new Date();
    period.totalAmount = totalAmount;
    period.staffCount = staff.length;
    await period.save();
    
    // Create accounting transaction for total payroll expense
    try {
      await OfficeTransaction.create({
        type: 'expense',
        category: 'Payroll Expenses',
        amount: totalAmount,
        date: new Date(),
        registeredBy: req.user?.id,
        branch: period.branch,
        description: `Payroll for ${period.month}/${period.year}`,
        reference: `PAYROLL-${period.year}-${period.month.toString().padStart(2, '0')}`,
        status: 'approved'
      });
    } catch (accountingErr) {
      console.error('Failed to create accounting transaction for payroll:', accountingErr);
    }
    
    try {
      emitEvent(period.branch.toString(), 'payroll.processed', { 
        period: period._id, 
        totalAmount, 
        staffCount: staff.length 
      });
    } catch (e) {}
    
    res.json({ data: payrollEntries });
  } catch (err: any) {
    console.error('POST /api/payroll/periods/:id/process error', err);
    res.status(500).json({ error: { message: 'Failed to process payroll' } });
  }
});

// Get payroll entries for a period
router.get('/entries', authMiddleware, requirePermission('staff'), async (req: AuthRequest, res) => {
  try {
    const { period } = req.query;
    
    if (!period) {
      return res.status(400).json({ error: { message: 'Period ID is required' } });
    }
    
    const entries = await PayrollEntry.find({ payrollPeriod: period })
      .populate('staff', 'names employeeId department type hourlyRate')
      .populate('payrollPeriod', 'month year status')
      .sort({ 'staff.names': 1 });
    
    res.json({ data: entries });
  } catch (err: any) {
    console.error('GET /api/payroll/entries error', err);
    res.status(500).json({ error: { message: 'Failed to fetch payroll entries' } });
  }
});

// Update payroll entry
router.put('/entries/:id', authMiddleware, requirePermission('staff'), async (req: AuthRequest, res) => {
  try {
    const { deductions, notes } = req.body;
    
    const entry = await PayrollEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: { message: 'Payroll entry not found' } });
    }
    
    if (entry.status === 'paid') {
      return res.status(400).json({ error: { message: 'Cannot modify paid payroll entries' } });
    }
    
    if (deductions) {
      entry.deductions = { ...entry.deductions, ...deductions };
    }
    if (notes) {
      entry.notes = notes;
    }
    
    await entry.save();
    
    const populatedEntry = await PayrollEntry.findById(entry._id)
      .populate('staff', 'names employeeId department type');
    
    res.json({ data: populatedEntry });
  } catch (err: any) {
    console.error('PUT /api/payroll/entries/:id error', err);
    res.status(500).json({ error: { message: 'Failed to update payroll entry' } });
  }
});

// Approve payroll entry
router.post('/entries/:id/approve', authMiddleware, requirePermission('staff'), async (req: AuthRequest, res) => {
  try {
    const entry = await PayrollEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: { message: 'Payroll entry not found' } });
    }
    
    entry.status = 'approved';
    await entry.save();
    
    const populatedEntry = await PayrollEntry.findById(entry._id)
      .populate('staff', 'names employeeId department type');
    
    res.json({ data: populatedEntry });
  } catch (err: any) {
    console.error('POST /api/payroll/entries/:id/approve error', err);
    res.status(500).json({ error: { message: 'Failed to approve payroll entry' } });
  }
});

// Mark payroll entry as paid
router.post('/entries/:id/pay', authMiddleware, requirePermission('staff'), async (req: AuthRequest, res) => {
  try {
    const { paymentDate, paymentMethod, notes } = req.body;
    
    const entry = await PayrollEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: { message: 'Payroll entry not found' } });
    }
    
    if (entry.status !== 'approved') {
      return res.status(400).json({ error: { message: 'Can only pay approved payroll entries' } });
    }
    
    entry.status = 'paid';
    entry.paymentDate = new Date(paymentDate);
    entry.paymentMethod = paymentMethod;
    if (notes) entry.notes = notes;
    
    await entry.save();
    
    const populatedEntry = await PayrollEntry.findById(entry._id)
      .populate('staff', 'names employeeId department type');
    
    try {
      emitEvent(entry.staff.toString(), 'payroll.paid', { 
        entry: populatedEntry,
        amount: entry.netSalary 
      });
    } catch (e) {}
    
    res.json({ data: populatedEntry });
  } catch (err: any) {
    console.error('POST /api/payroll/entries/:id/pay error', err);
    res.status(500).json({ error: { message: 'Failed to mark payroll entry as paid' } });
  }
});

// Get payroll summary for a period
router.get('/summary/:periodId', authMiddleware, requirePermission('staff'), async (req: AuthRequest, res) => {
  try {
    const entries = await PayrollEntry.find({ payrollPeriod: req.params.periodId })
      .populate('staff', 'names department type');
    
    const summary: {
      totalGrossSalary: number;
      totalDeductions: number;
      totalNetSalary: number;
      totalStaff: number;
      averageSalary: number;
      byDepartment: { department: string; staffCount: number; totalSalary: number }[];
      byPaymentType: any[];
    } = {
      totalGrossSalary: entries.reduce((sum, entry) => sum + entry.grossSalary, 0),
      totalDeductions: entries.reduce((sum, entry) => sum + entry.deductions.total, 0),
      totalNetSalary: entries.reduce((sum, entry) => sum + entry.netSalary, 0),
      totalStaff: entries.length,
      averageSalary: entries.length > 0 ? entries.reduce((sum, entry) => sum + entry.netSalary, 0) / entries.length : 0,
      byDepartment: [],
      byPaymentType: []
    };
    
    // Group by department
    const deptGroups = entries.reduce((acc, entry) => {
      const dept = (entry.staff as any).department || 'Unknown';
      if (!acc[dept]) {
        acc[dept] = { staffCount: 0, totalSalary: 0 };
      }
      acc[dept].staffCount++;
      acc[dept].totalSalary += entry.netSalary;
      return acc;
    }, {} as Record<string, { staffCount: number; totalSalary: number }>);
    
    summary.byDepartment = Object.entries(deptGroups).map(([department, data]) => ({
      department,
      staffCount: data.staffCount,
      totalSalary: data.totalSalary
    }));
    
    res.json({ data: summary });
  } catch (err: any) {
    console.error('GET /api/payroll/summary/:periodId error', err);
    res.status(500).json({ error: { message: 'Failed to fetch payroll summary' } });
  }
});

export default router;