import express from 'express';
import Branch from '../models/BranchModel';
import User from '../models/User';
import Student from '../models/Student';
import { authMiddleware, requirePermission, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all branches with hierarchical access
router.get('/', authMiddleware, requirePermission('branches'), async (req: AuthRequest, res) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1'));
    const limit = Math.max(10, parseInt((req.query.limit as string) || '20'));
    const skip = (page - 1) * limit;

    const filter: any = { isActive: true };

    // SuperAdmin can see all branches, Branch Managers can only see their branch
    if (!req.user?.isSuperAdmin && req.user?.branch) {
      filter._id = req.user.branch;
    }

    // Optional filters
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      filter.$or = [
        { name: searchRegex },
        { address: searchRegex },
        { email: searchRegex }
      ];
    }

    const total = await Branch.countDocuments(filter);
    const branches = await Branch.find(filter)
      .populate('manager', 'name email type')
      .populate('createdBy', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    // Update student and staff counts
    for (const branch of branches) {
      branch.studentCount = await Student.countDocuments({ branch: branch._id });
      branch.staffCount = await User.countDocuments({ branch: branch._id, isActive: true });
    }

    res.json({ data: branches, meta: { total, page, limit } });
  } catch (err) {
    console.error('GET /api/branches error', err);
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

// Create a new branch (SuperAdmin only)
router.post('/', authMiddleware, requirePermission('branches'), async (req: AuthRequest, res) => {
  try {
    // Only SuperAdmin can create branches
    if (!req.user?.isSuperAdmin) {
      return res.status(403).json({ error: 'Only SuperAdmin can create branches' });
    }

    const { 
      name, 
      address, 
      phoneNumber, 
      email, 
      manager, 
      establishedDate, 
      isActive,
      description,
      location,
      settings
    } = req.body;

    if (!name || !address || !phoneNumber || !email || !manager || !establishedDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate manager exists and is an Admin
    const managerUser = await User.findById(manager);
    if (!managerUser || managerUser.type !== 'Admin') {
      return res.status(400).json({ error: 'Manager must be a valid Admin user' });
    }

    // Check if manager is already assigned to another branch
    const existingBranch = await Branch.findOne({ manager, isActive: true });
    if (existingBranch) {
      return res.status(400).json({ error: 'Manager is already assigned to another branch' });
    }

    const branch = await Branch.create({
      name,
      address,
      phoneNumber,
      email,
      manager,
      establishedDate: new Date(establishedDate),
      isActive: isActive !== undefined ? isActive : true,
      studentCount: 0,
      staffCount: 0,
      description,
      location,
      settings,
      createdBy: req.user.id
    });

    // Update manager's branch assignment
    await User.findByIdAndUpdate(manager, { branch: branch._id });

    // Populate the response
    const populatedBranch = await Branch.findById(branch._id)
      .populate('manager', 'name email type')
      .populate('createdBy', 'name email');

    res.status(201).json(populatedBranch);
  } catch (err) {
    console.error('POST /api/branches error', err);
    res.status(500).json({ error: 'Failed to create branch' });
  }
});

// Get single branch
router.get('/:id', authMiddleware, requirePermission('branches'), async (req: AuthRequest, res) => {
  try {
    const branch = await Branch.findById(req.params.id)
      .populate('manager', 'name email type')
      .populate('createdBy', 'name email');

    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    // Check if user can access this branch (hierarchical access)
    if (!req.user?.isSuperAdmin && branch._id.toString() !== req.user?.branch) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get current counts
    branch.studentCount = await Student.countDocuments({ branch: branch._id });
    branch.staffCount = await User.countDocuments({ branch: branch._id, isActive: true });

    res.json(branch);
  } catch (err) {
    console.error('GET /api/branches/:id error', err);
    res.status(500).json({ error: 'Failed to fetch branch' });
  }
});

// Update a branch
router.put('/:id', authMiddleware, requirePermission('branches'), async (req: AuthRequest, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    // Check if user can modify this branch (hierarchical access)
    if (!req.user?.isSuperAdmin && branch._id.toString() !== req.user?.branch) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // If manager is being changed, validate new manager
    if (req.body.manager && req.body.manager !== branch.manager.toString()) {
      const newManager = await User.findById(req.body.manager);
      if (!newManager || newManager.type !== 'Admin') {
        return res.status(400).json({ error: 'New manager must be a valid Admin user' });
      }

      // Check if new manager is already assigned to another branch
      const existingBranch = await Branch.findOne({ 
        manager: req.body.manager, 
        isActive: true,
        _id: { $ne: req.params.id }
      });
      if (existingBranch) {
        return res.status(400).json({ error: 'New manager is already assigned to another branch' });
      }

      // Update old manager's branch assignment
      await User.findByIdAndUpdate(branch.manager, { $unset: { branch: 1 } });
      
      // Update new manager's branch assignment
      await User.findByIdAndUpdate(req.body.manager, { branch: branch._id });
    }

    const updatedBranch = await Branch.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    ).populate('manager', 'name email type').populate('createdBy', 'name email');

    res.json(updatedBranch);
  } catch (err) {
    console.error('PUT /api/branches/:id error', err);
    res.status(500).json({ error: 'Failed to update branch' });
  }
});

// Delete a branch (SuperAdmin only)
router.delete('/:id', authMiddleware, requirePermission('branches'), async (req: AuthRequest, res) => {
  try {
    // Only SuperAdmin can delete branches
    if (!req.user?.isSuperAdmin) {
      return res.status(403).json({ error: 'Only SuperAdmin can delete branches' });
    }

    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    // Check if branch has students or staff
    const studentCount = await Student.countDocuments({ branch: req.params.id });
    const staffCount = await User.countDocuments({ branch: req.params.id, isActive: true });

    if (studentCount > 0 || staffCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete branch. It has ${studentCount} students and ${staffCount} staff members. Please reassign them first.` 
      });
    }

    // Soft delete by setting isActive to false
    await Branch.findByIdAndUpdate(req.params.id, { isActive: false });
    
    // Remove branch assignment from manager
    await User.findByIdAndUpdate(branch.manager, { $unset: { branch: 1 } });

    res.json({ message: 'Branch deactivated successfully' });
  } catch (err) {
    console.error('DELETE /api/branches/:id error', err);
    res.status(500).json({ error: 'Failed to delete branch' });
  }
});

// Get branch statistics
router.get('/:id/stats', authMiddleware, requirePermission('branches'), async (req: AuthRequest, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    // Check if user can access this branch (hierarchical access)
    if (!req.user?.isSuperAdmin && branch._id.toString() !== req.user?.branch) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const studentCount = await Student.countDocuments({ branch: req.params.id });
    const staffCount = await User.countDocuments({ branch: req.params.id, isActive: true });
    
    // Get student status breakdown
    const studentStatusBreakdown = await Student.aggregate([
      { $match: { branch: branch._id } },
      {
        $group: {
          _id: '$tuitionStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get staff type breakdown
    const staffTypeBreakdown = await User.aggregate([
      { $match: { branch: branch._id, isActive: true } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      studentCount,
      staffCount,
      studentStatusBreakdown: studentStatusBreakdown.reduce((acc, item) => {
        acc[item._id || 'Unknown'] = item.count;
        return acc;
      }, {} as Record<string, number>),
      staffTypeBreakdown: staffTypeBreakdown.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>)
    });
  } catch (err) {
    console.error('GET /api/branches/:id/stats error', err);
    res.status(500).json({ error: 'Failed to fetch branch statistics' });
  }
});

export default router;
