import express from 'express';
import Branch from '../models/BranchModel';
import User from '../models/User';

const router = express.Router();

// Get all branches
router.get('/', async (req, res) => {
  try {
    // Populate the manager with the 'name' field (User model uses 'name')
    const branches = await Branch.find().populate('manager', 'name email type');
    res.json(branches);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

// Create a new branch
router.post('/', async (req, res) => {
  try {
    const { name, address, phoneNumber, email, manager, establishedDate, isActive } = req.body;
    // Validate manager exists and is an Admin
    const managerUser = await User.findById(manager);
    if (!managerUser || managerUser.type !== 'Admin') {
      return res.status(400).json({ error: 'Manager must be a valid Admin user' });
    }
    const branch = await Branch.create({
      name,
      address,
      phoneNumber,
      email,
      manager,
      establishedDate,
      isActive: isActive !== undefined ? isActive : true,
      studentCount: 0,
      staffCount: 0,
    });
    res.status(201).json(branch);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create branch' });
  }
});

// Update a branch
router.put('/:id', async (req, res) => {
  try {
    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    res.json(branch);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update branch' });
  }
});

// Delete a branch
router.delete('/:id', async (req, res) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    res.json({ message: 'Branch deleted' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete branch' });
  }
});

export default router;
