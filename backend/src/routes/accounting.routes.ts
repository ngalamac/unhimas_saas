import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Office accounting routes
router.get('/transactions', authorize(['accounting', 'all']), (req, res) => {
  res.json({ success: true, message: 'Get all transactions', data: [] });
});

router.post('/income', authorize(['accounting', 'all']), (req, res) => {
  res.json({ success: true, message: 'Record income', data: {} });
});

router.post('/expense', authorize(['accounting', 'all']), (req, res) => {
  res.json({ success: true, message: 'Record expense', data: {} });
});

router.get('/reports', authorize(['accounting', 'financial_reports', 'all']), (req, res) => {
  res.json({ success: true, message: 'Get accounting reports', data: {} });
});

router.get('/balance', authorize(['accounting', 'all']), (req, res) => {
  res.json({ success: true, message: 'Get account balance', data: {} });
});

export default router;