import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import BranchModel from '../models/BranchModel';
import { authMiddleware, requireUserManagement, requirePermission, AuthRequest } from '../middleware/auth';
import { deleteFileFromGridFS } from '../services/fileService';
import { RoleType } from '../lib/rolePermissions';

const router = express.Router();

// Get all users with hierarchical filtering
router.get('/', authMiddleware, requireUserManagement(), async (req: AuthRequest, res) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1'));
    const limit = Math.max(10, parseInt((req.query.limit as string) || '20'));
    const skip = (page - 1) * limit;

    const filter: any = { isActive: true };

    // SuperAdmin can see all users, Branch Managers can only see users in their branch
    console.log('[users] Debug - User check:', { 
      userType: req.user?.type, 
      isSuperAdmin: req.user?.isSuperAdmin, 
      branch: req.user?.branch,
      condition: !req.user?.isSuperAdmin
    });
    
    if (!req.user?.isSuperAdmin) {
      // Branch Managers should not see SuperAdmin users
      filter.type = { $ne: 'SuperAdmin' };
      
      // If user has a branch, filter by branch
      if (req.user?.branch) {
        filter.branch = req.user?.branch;
      }
      
      console.log('[users] Branch Manager filter applied:', { 
        userType: req.user?.type, 
        isSuperAdmin: req.user?.isSuperAdmin, 
        branch: req.user?.branch, 
        filter 
      });
    } else {
      console.log('[users] SuperAdmin access:', { 
        userType: req.user?.type, 
        isSuperAdmin: req.user?.isSuperAdmin, 
        branch: req.user?.branch 
      });
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
    res.status(500).json({ error: { message: 'Failed to fetch users' } });
  }
});

// Create new user
// Helper to normalize role strings coming from UI
function normalizeRole(input: string): RoleType | null {
  const key = (input || '').trim().toLowerCase();
  const map: Record<string, RoleType> = {
    'superadmin': 'SuperAdmin',
    'super admin': 'SuperAdmin',
    'admin': 'Admin',
    'registrar': 'Registrar',
    'lecturer': 'Lecturer',
    'accountant': 'Accountant',
    'dean of studies': 'Dean of Studies',
    'dean': 'Dean of Studies',
    'head of department': 'Head Of Department',
    'hod': 'Head Of Department',
  };
  return (map as any)[key] || null;
}

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
      return res.status(400).json({ error: { message: 'Missing required fields' } });
    }

    // Normalize email and role
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedRole = normalizeRole(String(type));
    if (!normalizedRole) {
      return res.status(400).json({ error: { message: 'Invalid user type. Allowed: SuperAdmin, Admin, Lecturer, Accountant, Dean of Studies, Head Of Department' } });
    }

    // Only SuperAdmin can create another SuperAdmin
    if (!req.user?.isSuperAdmin && normalizedRole === 'SuperAdmin') {
      return res.status(403).json({ error: { message: 'Only SuperAdmin can create SuperAdmin users' } });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ error: { message: 'Email already exists' } });
    }

    // Check if employeeId already exists (if provided)
    if (employeeId) {
      const existingEmployee = await User.findOne({ employeeId });
      if (existingEmployee) {
        return res.status(400).json({ error: { message: 'Employee ID already exists' } });
      }
    }

    // Determine branch assignment
    let branchId: any = branch;
    // Treat empty string as undefined (avoid ObjectId cast error)
    if (typeof branchId === 'string' && branchId.trim() === '') {
      branchId = undefined;
    }
    if (!req.user?.isSuperAdmin) {
      branchId = req.user?.branch; // Non-SuperAdmin users can only create users in their branch
    }

    // Verify branch exists
    if (branchId) {
      const branchExists = await BranchModel.findById(branchId);
      if (!branchExists) {
        return res.status(400).json({ error: { message: 'Invalid branch' } });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const userPayload: any = {
      name,
      email: normalizedEmail,
      password: hashedPassword,
      type: normalizedRole,
      permissions: permissions || {},
      createdBy: req.user?.id,
      employeeId,
      phoneNumber,
      department
    };
    if (branchId) userPayload.branch = branchId;

    const user = new User(userPayload);

    await user.save();

    // Populate the response
    const populatedUser = await User.findById(user._id)
      .populate('branch', 'name')
      .populate('createdBy', 'name email');

    res.status(201).json({ data: populatedUser });
  } catch (err: any) {
    console.error('POST /api/users error', err);
    // Duplicate key error handling
    if (err && (err.code === 11000 || err.code === '11000')) {
      if (err.keyPattern?.email) {
        return res.status(400).json({ error: { message: 'Email already exists' } });
      }
      if (err.keyPattern?.employeeId) {
        return res.status(400).json({ error: { message: 'Employee ID already exists' } });
      }
      return res.status(400).json({ error: { message: 'Duplicate value for unique field' } });
    }
    if (err?.name === 'ValidationError') {
      try {
        const details = Object.values(err.errors || {}).map((e: any) => e?.message).filter(Boolean);
        return res.status(400).json({ error: { message: 'Validation error', details } });
      } catch {
        return res.status(400).json({ error: { message: 'Validation error' } });
      }
    }
    res.status(500).json({ error: { message: 'Failed to create user' } });
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
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    res.json({ data: user });
  } catch (err) {
    console.error('GET /api/users/:id error', err);
    res.status(500).json({ error: { message: 'Failed to fetch user' } });
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

    // Prevent Branch Managers from changing their own role or other users' roles
    if (!req.user?.isSuperAdmin && req.body.type && req.body.type !== user.type) {
      return res.status(403).json({ error: 'Only SuperAdmin can change user roles' });
    }

    const updates = req.body;

    // If profile picture is being updated, delete the old one
    if (updates.profilePicture && user.profilePicture && updates.profilePicture !== user.profilePicture) {
        await deleteFileFromGridFS(user.profilePicture);
    }
    
    // Hash password if provided
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    // Remove sensitive fields that shouldn't be updated directly
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;

    // Branch Managers cannot change user types/roles - only SuperAdmin can
    if (!req.user?.isSuperAdmin) {
      delete updates.type;
      delete updates.branch; // Branch Managers cannot reassign users to different branches
      delete updates.createdBy; // Cannot change who created the user
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id, 
      updates, 
      { new: true, runValidators: true }
    ).populate('branch', 'name').populate('createdBy', 'name email');

    res.json({ data: updatedUser });
  } catch (err) {
    console.error('PUT /api/users/:id error', err);
    res.status(500).json({ error: { message: 'Failed to update user' } });
  }
});

// Update user permissions
router.put('/:id/permissions', authMiddleware, requireUserManagement(), async (req: AuthRequest, res) => {
  try {
    const { permissions, replace } = req.body as { permissions: any; replace?: boolean };
    
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

    // Prevent users from modifying their own permissions
    console.log('[users] Permission check:', { 
      targetUserId: user._id.toString(), 
      currentUserId: req.user?.id,
      areEqual: user._id.toString() === req.user?.id 
    });
    if (user._id.toString() === req.user?.id) {
      return res.status(403).json({ error: 'Cannot modify your own permissions' });
    }

    let nextPermissions = permissions || {};

    // If not replace mode, merge with existing so unspecified actions remain unchanged
    if (!replace) {
      const merged: Record<string, Record<string, boolean>> = { ...(user.permissions || {}) };
      for (const feature of Object.keys(nextPermissions)) {
        merged[feature] = { ...(merged[feature] || {}), ...nextPermissions[feature] };
      }
      nextPermissions = merged;
    }

    // Sanitize: remove any features with only falsy values or empty objects after replace
    if (replace) {
      for (const feature of Object.keys(nextPermissions)) {
        const actions = nextPermissions[feature];
        if (!actions || Object.values(actions).every(v => v === false)) {
          delete nextPermissions[feature];
        }
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { permissions: nextPermissions },
      { new: true }
    ).populate('branch', 'name').populate('createdBy', 'name email');

    res.json({ data: updatedUser });
  } catch (err) {
    console.error('PUT /api/users/:id/permissions error', err);
    res.status(500).json({ error: { message: 'Failed to update permissions' } });
  }
});

// Delete user (soft delete by setting isActive to false)
router.delete('/:id', authMiddleware, requireUserManagement(), async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.profilePicture) {
        await deleteFileFromGridFS(user.profilePicture);
    }

    // Check if user can delete this user (hierarchical access)
    if (!req.user?.isSuperAdmin && user.branch && user.branch.toString() !== req.user?.branch) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Prevent deletion of SuperAdmin
    if (user.type === 'SuperAdmin') {
      return res.status(403).json({ error: 'Cannot delete SuperAdmin user' });
    }

    // Prevent users from deleting themselves
    console.log('[users] Delete check:', { 
      targetUserId: user._id.toString(), 
      currentUserId: req.user?.id,
      areEqual: user._id.toString() === req.user?.id 
    });
    if (user._id.toString() === req.user?.id) {
      return res.status(403).json({ error: 'Cannot delete your own account' });
    }

    // Soft delete by setting isActive to false
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    
    res.json({ message: 'User deactivated successfully' });
  } catch (err) {
    console.error('DELETE /api/users/:id error', err);
    res.status(500).json({ error: { message: 'Failed to delete user' } });
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
    res.status(500).json({ error: { message: 'Failed to fetch user statistics' } });
  }
});

export default router;
