import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Admission management routes
router.get('/', authorize(['students', 'all']), (req, res) => {
  res.json({ success: true, message: 'Get all admission applications', data: [] });
});

router.get('/:id', authorize(['students', 'all']), (req, res) => {
  res.json({ success: true, message: 'Get admission application by ID', data: {} });
});

router.post('/', (req, res) => {
  res.json({ success: true, message: 'Submit admission application', data: {} });
});

router.put('/:id/approve', authorize(['students', 'all']), (req, res) => {
  res.json({ success: true, message: 'Approve admission application', data: {} });
});

router.put('/:id/reject', authorize(['students', 'all']), (req, res) => {
  res.json({ success: true, message: 'Reject admission application', data: {} });
});

router.delete('/:id', authorize(['students', 'all']), (req, res) => {
  res.json({ success: true, message: 'Delete admission application' });
});

export default router;