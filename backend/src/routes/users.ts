import express from 'express';
import User from '../models/User';
import Branch from '../models/Branch';
import mongoose from 'mongoose';

const router = express.Router();
// Delete branch by ID
router.delete('/branches/:branchId', async (req, res) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.branchId);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    res.json({ message: 'Branch deleted' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete branch' });
  }
});

// Toggle branch active/inactive status
router.post('/branches/:branchId/toggle-active', async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.branchId);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    // @ts-ignore
    branch.isActive = !branch.isActive;
    await branch.save();
    res.json(branch);
  } catch (err) {
    res.status(400).json({ error: 'Failed to toggle branch status' });
  }
});
// Get all branches (for superadmin/admin)
router.get('/branches', async (req, res) => {
  try {
    // Populate manager details and return all branch fields
    const branches = await Branch.find().populate('manager', 'name email phone');
    res.json(branches);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user permissions
router.put('/:id/permissions', async (req, res) => {
  try {
    const { permissions } = req.body;
    console.log('USER PERMISSIONS UPDATE: Received for user', req.params.id, permissions);
    const user = await User.findByIdAndUpdate(req.params.id, { permissions }, { new: true });
    if (!user) {
      console.log('USER PERMISSIONS UPDATE: User not found for id', req.params.id);
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('USER PERMISSIONS UPDATE: Saved for user', user.email, user.permissions);
    res.json(user);
  } catch (err) {
    console.log('USER PERMISSIONS UPDATE: Error', err);
    res.status(400).json({ error: 'Failed to update permissions' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete user' });
  }
});


// Create a branch (superadmin only)
router.post('/branches', async (req, res) => {
  try {
    const { name, address, phone, email, managerName, establishedDate, creatorId } = req.body;
    // Validate required fields
    if (!name) return res.status(400).json({ error: 'Branch name is required.' });
    if (!address) return res.status(400).json({ error: 'Branch address is required.' });
    if (!phone) return res.status(400).json({ error: 'Branch phone is required.' });
    if (!email) return res.status(400).json({ error: 'Branch email is required.' });
  if (!managerName || managerName.trim() === '') return res.status(400).json({ error: 'Branch manager is required.' });
    if (!establishedDate) return res.status(400).json({ error: 'Established date is required.' });
    if (!creatorId) return res.status(400).json({ error: 'Creator ID is required.' });

    // Only superadmin can create branches
    const creator = await User.findById(creatorId);
    if (!creator) {
      return res.status(403).json({ error: 'Creator not found.' });
    }
    if (creator.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only superadmin can create branches.' });
    }

    // Find manager by name
    const manager = await User.findOne({ name: managerName });
    if (!manager) {
      return res.status(400).json({ error: 'Selected manager does not exist.' });
    }

    // Create branch with all fields
    const branch = new Branch({
      name,
      address,
      phone,
      email,
      manager: manager._id,
      users: [manager._id],
      establishedDate
    });
    await branch.save();
    // Assign branch to manager
    await User.findByIdAndUpdate(manager._id, { $addToSet: { branches: branch._id }, role: 'branch_manager' });
    res.status(201).json(branch);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create branch', details: String(err) });
  }
});

// Assign manager to branch (superadmin only)
router.post('/branches/:branchId/assign-manager', async (req, res) => {
  try {
    const { managerId } = req.body;
  const creator = await User.findById(req.body.creatorId);
    if (!creator || creator.role !== 'superadmin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const branch = await Branch.findByIdAndUpdate(
      req.params.branchId,
      { manager: managerId, $addToSet: { users: managerId } },
      { new: true }
    );
    await User.findByIdAndUpdate(managerId, { $addToSet: { branches: branch?._id }, role: 'branch_manager' });
    res.json(branch);
  } catch (err) {
    res.status(400).json({ error: 'Failed to assign manager' });
  }
});

// Get branches for a user
router.get('/:id/branches', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'CURRENT_USER_ID') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const branches = await Branch.find({ _id: { $in: user.branches } });
    res.json(Array.isArray(branches) ? branches : []);
  } catch (err) {
    res.status(400).json({ error: 'Failed to fetch branches' });
  }
});

// Switch active branch for a user
router.post('/:id/switch-branch', async (req, res) => {
  try {
    const { branchId } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.branches.map(b => b.toString()).includes(branchId)) {
      return res.status(403).json({ error: 'User does not have access to this branch' });
    }
    // Store active branch in user document (optional, or use session)
    user.set('activeBranch', branchId);
    await user.save();
    res.json({ message: 'Branch switched', branchId });
  } catch (err) {
    res.status(400).json({ error: 'Failed to switch branch' });
  }
});

export default router;
