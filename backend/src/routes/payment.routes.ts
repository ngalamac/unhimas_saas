import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Payment management routes
router.get('/', authorize(['payments', 'all']), (req, res) => {
  res.json({ success: true, message: 'Get all payments', data: [] });
});

router.get('/student/:studentId', authorize(['payments', 'all']), (req, res) => {
  res.json({ success: true, message: 'Get payments by student', data: [] });
});

router.post('/', authorize(['payments', 'all']), (req, res) => {
  res.json({ success: true, message: 'Process payment', data: {} });
});

router.put('/:id/status', authorize(['payments', 'all']), (req, res) => {
  res.json({ success: true, message: 'Update payment status', data: {} });
});

router.get('/reports', authorize(['payments', 'financial_reports', 'all']), (req, res) => {
  res.json({ success: true, message: 'Get payment reports', data: {} });
});

export default router;