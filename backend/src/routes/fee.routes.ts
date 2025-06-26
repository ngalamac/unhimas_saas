import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Fee structure management routes
router.get('/', authorize(['fees', 'all']), (req, res) => {
  res.json({ success: true, message: 'Get all fee structures', data: [] });
});

router.get('/program/:programId', authorize(['fees', 'all']), (req, res) => {
  res.json({ success: true, message: 'Get fees by program', data: [] });
});

router.post('/', authorize(['fees', 'all']), (req, res) => {
  res.json({ success: true, message: 'Create fee structure', data: {} });
});

router.put('/:id', authorize(['fees', 'all']), (req, res) => {
  res.json({ success: true, message: 'Update fee structure', data: {} });
});

router.delete('/:id', authorize(['fees', 'all']), (req, res) => {
  res.json({ success: true, message: 'Delete fee structure' });
});

export default router;