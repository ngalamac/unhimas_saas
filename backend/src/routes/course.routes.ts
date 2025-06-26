import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Course management routes
router.get('/', authorize(['courses', 'department_courses', 'all']), (req, res) => {
  res.json({ success: true, message: 'Get all courses', data: [] });
});

router.get('/:id', authorize(['courses', 'department_courses', 'all']), (req, res) => {
  res.json({ success: true, message: 'Get course by ID', data: {} });
});

router.post('/', authorize(['courses', 'all']), (req, res) => {
  res.json({ success: true, message: 'Create course', data: {} });
});

router.put('/:id', authorize(['courses', 'all']), (req, res) => {
  res.json({ success: true, message: 'Update course', data: {} });
});

router.delete('/:id', authorize(['courses', 'all']), (req, res) => {
  res.json({ success: true, message: 'Delete course' });
});

export default router;