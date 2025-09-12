import express from 'express';
import StaffMember from '../models/StaffMember';
import Counter from '../models/Counter';
import { authMiddleware, requirePermission, AuthRequest } from '../middleware/auth';
import { emitEvent } from '../lib/events';

const router = express.Router();

// Get all staff with filtering and pagination
router.get('/', authMiddleware, requirePermission('staff'), async (req: AuthRequest, res) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1'));
    const limit = Math.max(10, parseInt((req.query.limit as string) || '20'));
    const skip = (page - 1) * limit;
    
    const filter: any = { isActive: true };
    
    // Branch filtering
    if (!req.user?.isSuperAdmin && req.user?.branch) {
      filter.branch = req.user.branch;
    } else if (req.query.branch) {
      filter.branch = req.query.branch;
    }
    
    // Additional filters
    if (req.query.type) filter.type = req.query.type;
    if (req.query.department) filter.department = req.query.department;
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      filter.$or = [
        { names: searchRegex },
        { email: searchRegex },
        { employeeId: searchRegex }
      ];
    }
    
    const total = await StaffMember.countDocuments(filter);
    const staff = await StaffMember.find(filter)
      .populate('branch', 'name')
      .populate('createdBy', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    res.json({ data: staff, meta: { total, page, limit } });
  } catch (err: any) {
    console.error('GET /api/staff error', err);
    res.status(500).json({ error: { message: 'Failed to fetch staff' } });
  }
});

// Create new staff member
router.post('/', authMiddleware, requirePermission('staff'), async (req: AuthRequest, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      department,
      position,
      type,
      hireDate,
      hourlyRate,
      baseSalary,
      paymentType,
      branch,
      address,
      emergencyContact,
      bankDetails
    } = req.body;
    
    if (!firstName || !lastName || !email || !phoneNumber || !department || !position || !type || !hireDate) {
      return res.status(400).json({ error: { message: 'Missing required fields' } });
    }
    
    if (paymentType === 'hourly' && (!hourlyRate || hourlyRate <= 0)) {
      return res.status(400).json({ error: { message: 'Hourly rate is required for hourly staff' } });
    }
    
    if (paymentType === 'fixed' && (!baseSalary || baseSalary <= 0)) {
      return res.status(400).json({ error: { message: 'Base salary is required for fixed salary staff' } });
    }
    
    // Check if email already exists
    const existingStaff = await StaffMember.findOne({ email });
    if (existingStaff) {
      return res.status(400).json({ error: { message: 'Email already exists' } });
    }
    
    // Generate employee ID
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'employeeId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const year = new Date().getFullYear().toString().slice(-2);
    const employeeId = `EMP${year}${counter.seq.toString().padStart(4, '0')}`;
    
    // Determine branch
    const branchId = req.user?.isSuperAdmin ? branch : req.user?.branch;
    if (!branchId) {
      return res.status(400).json({ error: { message: 'Branch is required' } });
    }
    
    const staffMember = new StaffMember({
      firstName,
      lastName,
      email,
      phoneNumber,
      employeeId,
      department,
      position,
      type,
      hireDate: new Date(hireDate),
      hourlyRate: hourlyRate || 0,
      baseSalary: baseSalary || 0,
      paymentType: paymentType || 'hourly',
      branch: branchId,
      address,
      emergencyContact,
      bankDetails,
      createdBy: req.user?.id
    });
    
    await staffMember.save();
    
    const populatedStaff = await StaffMember.findById(staffMember._id)
      .populate('branch', 'name')
      .populate('createdBy', 'name');
    
    try {
      emitEvent(branchId, 'staff.created', { staff: populatedStaff });
    } catch (e) {}
    
    res.status(201).json({ data: populatedStaff });
  } catch (err: any) {
    console.error('POST /api/staff error', err);
    res.status(500).json({ error: { message: 'Failed to create staff member' } });
  }
});

// Update staff member
router.put('/:id', authMiddleware, requirePermission('staff'), async (req: AuthRequest, res) => {
  try {
    const updates = req.body;
    
    // Remove sensitive fields that shouldn't be updated directly
    delete updates._id;
    delete updates.employeeId;
    delete updates.createdAt;
    delete updates.updatedAt;
    
    const updatedStaff = await StaffMember.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('branch', 'name').populate('createdBy', 'name');
    
    if (!updatedStaff) {
      return res.status(404).json({ error: { message: 'Staff member not found' } });
    }
    
    try {
      emitEvent(updatedStaff.branch.toString(), 'staff.updated', { staff: updatedStaff });
    } catch (e) {}
    
    res.json({ data: updatedStaff });
  } catch (err: any) {
    console.error('PUT /api/staff/:id error', err);
    res.status(500).json({ error: { message: 'Failed to update staff member' } });
  }
});

// Soft delete staff member
router.delete('/:id', authMiddleware, requirePermission('staff'), async (req: AuthRequest, res) => {
  try {
    const staff = await StaffMember.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!staff) {
      return res.status(404).json({ error: { message: 'Staff member not found' } });
    }
    
    try {
      emitEvent(staff.branch.toString(), 'staff.deactivated', { staff });
    } catch (e) {}
    
    res.json({ message: 'Staff member deactivated successfully' });
  } catch (err: any) {
    console.error('DELETE /api/staff/:id error', err);
    res.status(500).json({ error: { message: 'Failed to deactivate staff member' } });
  }
});

// Stats overview endpoint
router.get('/stats/overview', authMiddleware, requirePermission('staff'), async (req: AuthRequest, res) => {
  try {
    const filter: any = {};
    
    // Branch filtering
    if (!req.user?.isSuperAdmin && req.user?.branch) {
      filter.branch = req.user.branch;
    }
    
    const [totalStaff, activeStaff, byType, byDepartment] = await Promise.all([
      StaffMember.countDocuments(filter),
      StaffMember.countDocuments({ ...filter, isActive: true }),
      StaffMember.aggregate([
        { $match: { ...filter, isActive: true } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      StaffMember.aggregate([
        { $match: { ...filter, isActive: true } },
        { $group: { _id: '$department', count: { $sum: 1 } } }
      ])
    ]);
    
    res.json({ 
      total: totalStaff,
      active: activeStaff,
      inactive: totalStaff - activeStaff,
      byType,
      byDepartment
    });
  } catch (err: any) {
    console.error('GET /api/staff/stats/overview error', err);
    res.status(500).json({ error: { message: 'Failed to fetch staff stats' } });
  }
});

export default router;
