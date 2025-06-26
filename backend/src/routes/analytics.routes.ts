import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Analytics routes
router.get('/dashboard', authorize(['reports', 'all']), (req, res) => {
  res.json({ success: true, message: 'Get dashboard analytics', data: {} });
});

router.get('/students', authorize(['reports', 'academic_reports', 'all']), (req, res) => {
  res.json({ success: true, message: 'Get student analytics', data: {} });
});

router.get('/financial', authorize(['financial_reports', 'all']), (req, res) => {
  res.json({ success: true, message: 'Get financial analytics', data: {} });
});

router.get('/attendance', authorize(['reports', 'all']), (req, res) => {
  res.json({ success: true, message: 'Get attendance analytics', data: {} });
});

router.get('/performance', authorize(['academic_reports', 'all']), (req, res) => {
  res.json({ success: true, message: 'Get performance analytics', data: {} });
});

export default router;