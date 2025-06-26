import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Grade management routes
router.get('/', authorize(['grades', 'academic_reports', 'all']), (req, res) => {
  res.json({ success: true, message: 'Get all grades', data: [] });
});

router.get('/student/:studentId', authorize(['grades', 'academic_reports', 'all']), (req, res) => {
  res.json({ success: true, message: 'Get grades by student', data: [] });
});

router.post('/', authorize(['grades', 'all']), (req, res) => {
  res.json({ success: true, message: 'Record grade', data: {} });
});

router.put('/:id', authorize(['grades', 'all']), (req, res) => {
  res.json({ success: true, message: 'Update grade', data: {} });
});

router.delete('/:id', authorize(['grades', 'all']), (req, res) => {
  res.json({ success: true, message: 'Delete grade' });
});

export default router;