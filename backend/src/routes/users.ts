import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import BranchModel from '../models/BranchModel';
import { authMiddleware, requireUserManagement, requirePermission, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all users with hierarchical filtering
router.get('/', authMiddleware, requireUserManagement(), async (req: AuthRequest, res) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1'));
    const limit = Math.max(10, parseInt((req.query.limit as string) || '20'));
    const skip = (page - 1) * limit;

    const filter: any = { isActive: true };

    // SuperAdmin can see all users, Branch Managers can only see users in their branch
    if (!req.user?.isSuperAdmin && req.user?.branch) {
      filter.branch = req.user.branch;
      // Branch Managers should not see SuperAdmin users
      filter.type = { $ne: 'SuperAdmin' };
    }

    // Optional filters
    if (req.query.type) filter.type = req.query.type;
    if (req.query.branch && req.user?.isSuperAdmin) filter.branch = req.query.branch;
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { employeeId: searchRegex }
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .populate('branch', 'name')
      .populate('createdBy', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    res.json({ data: users, meta: { total, page, limit } });
  } catch (err) {
    console.error('GET /api/users error', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create new user
router.post('/', authMiddleware, requireUserManagement(), async (req: AuthRequest, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      type, 
      permissions, 
      branch, 
      employeeId, 
      phoneNumber, 
      department 
    } = req.body;

    if (!name || !email || !password || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Check if employeeId already exists (if provided)
    if (employeeId) {
      const existingEmployee = await User.findOne({ employeeId });
      if (existingEmployee) {
        return res.status(400).json({ error: 'Employee ID already exists' });
      }
    }

    // Determine branch assignment
    let branchId = branch;
    if (!req.user?.isSuperAdmin) {
      branchId = req.user?.branch; // Non-SuperAdmin users can only create users in their branch
    }

    // Verify branch exists
    if (branchId) {
      const branchExists = await BranchModel.findById(branchId);
      if (!branchExists) {
        return res.status(400).json({ error: 'Invalid branch' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      type,
      permissions: permissions || {},
      branch: branchId,
      createdBy: req.user?.id,
      employeeId,
      phoneNumber,
      department
    });

    await user.save();

    // Populate the response
    const populatedUser = await User.findById(user._id)
      .populate('branch', 'name')
      .populate('createdBy', 'name email');

    res.status(201).json(populatedUser);
  } catch (err) {
    console.error('POST /api/users error', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Get single user
router.get('/:id', authMiddleware, requireUserManagement(), async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('branch', 'name')
      .populate('createdBy', 'name email');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user can access this user (hierarchical access)
    if (!req.user?.isSuperAdmin && user.branch && user.branch.toString() !== req.user?.branch) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(user);
  } catch (err) {
    console.error('GET /api/users/:id error', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user
router.put('/:id', authMiddleware, requireUserManagement(), async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user can modify this user (hierarchical access)
    if (!req.user?.isSuperAdmin && user.branch && user.branch.toString() !== req.user?.branch) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Prevent modification of SuperAdmin by non-SuperAdmin users
    if (user.type === 'SuperAdmin' && !req.user?.isSuperAdmin) {
      return res.status(403).json({ error: 'Cannot modify SuperAdmin user' });
    }

    const updates = req.body;
    
    // Hash password if provided
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    // Remove sensitive fields that shouldn't be updated directly
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id, 
      updates, 
      { new: true, runValidators: true }
    ).populate('branch', 'name').populate('createdBy', 'name email');

    res.json(updatedUser);
  } catch (err) {
    console.error('PUT /api/users/:id error', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Update user permissions
router.put('/:id/permissions', authMiddleware, requireUserManagement(), async (req: AuthRequest, res) => {
  try {
    const { permissions } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user can modify this user (hierarchical access)
    if (!req.user?.isSuperAdmin && user.branch && user.branch.toString() !== req.user?.branch) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Prevent modification of SuperAdmin permissions by non-SuperAdmin users
    if (user.type === 'SuperAdmin' && !req.user?.isSuperAdmin) {
      return res.status(403).json({ error: 'Cannot modify SuperAdmin permissions' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id, 
      { permissions }, 
      { new: true }
    ).populate('branch', 'name').populate('createdBy', 'name email');

    res.json(updatedUser);
  } catch (err) {
    console.error('PUT /api/users/:id/permissions error', err);
    res.status(500).json({ error: 'Failed to update permissions' });
  }
});

// Delete user (soft delete by setting isActive to false)
router.delete('/:id', authMiddleware, requireUserManagement(), async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user can delete this user (hierarchical access)
    if (!req.user?.isSuperAdmin && user.branch && user.branch.toString() !== req.user?.branch) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Prevent deletion of SuperAdmin
    if (user.type === 'SuperAdmin') {
      return res.status(403).json({ error: 'Cannot delete SuperAdmin user' });
    }

    // Soft delete by setting isActive to false
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    
    res.json({ message: 'User deactivated successfully' });
  } catch (err) {
    console.error('DELETE /api/users/:id error', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get user statistics
router.get('/stats/overview', authMiddleware, requireUserManagement(), async (req: AuthRequest, res) => {
  try {
    const filter: any = { isActive: true };
    
    // Branch filtering
    if (!req.user?.isSuperAdmin && req.user?.branch) {
      filter.branch = req.user.branch;
    }

    const stats = await User.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalUsers = await User.countDocuments(filter);
    const activeUsers = await User.countDocuments({ ...filter, lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } });

    res.json({
      totalUsers,
      activeUsers,
      byType: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {} as Record<string, number>)
    });
  } catch (err) {
    console.error('GET /api/users/stats/overview error', err);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

export default router;
