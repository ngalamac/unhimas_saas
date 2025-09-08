import express from 'express';
import Specialty from '../models/Specialty';
import Department from '../models/Department';
import { authMiddleware, requirePermission, AuthRequest } from '../middleware/auth';

const router = express.Router();

// GET all specialties, optionally filtered by department
router.get('/', authMiddleware, requirePermission('academics.read'), async (req, res) => {
  try {
    const filter: any = {};
    if (req.query.department) {
      filter.department = req.query.department;
    }
    const specialties = await Specialty.find(filter).populate('department', 'name');
    res.json(specialties);
  } catch (err) {
    console.error('GET /api/specialties error', err);
    res.status(500).json({ error: 'Failed to fetch specialties' });
  }
});

// GET a single specialty by ID
router.get('/:id', authMiddleware, requirePermission('academics.read'), async (req, res) => {
  try {
    const specialty = await Specialty.findById(req.params.id).populate('department', 'name');
    if (!specialty) {
      return res.status(404).json({ error: 'Specialty not found' });
    }
    res.json(specialty);
  } catch (err) {
    console.error(`GET /api/specialties/${req.params.id} error`, err);
    res.status(500).json({ error: 'Failed to fetch specialty' });
  }
});

// POST to create a new specialty
router.post('/', authMiddleware, requirePermission('academics.create'), async (req: AuthRequest, res) => {
  try {
    const { name, department } = req.body;
    if (!name || !department) {
      return res.status(400).json({ error: 'Name and department are required' });
    }

    // Check if department exists
    const departmentExists = await Department.findById(department);
    if (!departmentExists) {
      return res.status(400).json({ error: 'Invalid department ID' });
    }

    const newSpecialty = new Specialty({
      name,
      department,
      createdBy: req.user?.id
    });

    await newSpecialty.save();
    res.status(201).json(newSpecialty);
  } catch (err) {
    console.error('POST /api/specialties error', err);
    res.status(500).json({ error: 'Failed to create specialty' });
  }
});

// PUT to update a specialty
router.put('/:id', authMiddleware, requirePermission('academics.update'), async (req, res) => {
  try {
    const { name, department } = req.body;
    const specialty = await Specialty.findById(req.params.id);

    if (!specialty) {
      return res.status(404).json({ error: 'Specialty not found' });
    }

    if (name) specialty.name = name;
    if (department) {
      const departmentExists = await Department.findById(department);
      if (!departmentExists) {
        return res.status(400).json({ error: 'Invalid department ID' });
      }
      specialty.department = department;
    }

    await specialty.save();
    res.json(specialty);
  } catch (err) {
    console.error(`PUT /api/specialties/${req.params.id} error`, err);
    res.status(500).json({ error: 'Failed to update specialty' });
  }
});

// DELETE a specialty
router.delete('/:id', authMiddleware, requirePermission('academics.delete'), async (req, res) => {
  try {
    const specialty = await Specialty.findByIdAndDelete(req.params.id);
    if (!specialty) {
      return res.status(404).json({ error: 'Specialty not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error(`DELETE /api/specialties/${req.params.id} error`, err);
    res.status(500).json({ error: 'Failed to delete specialty' });
  }
});

export default router;
