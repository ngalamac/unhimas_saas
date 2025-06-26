import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Program management routes
router.get('/', authorize(['programs', 'all']), (req, res) => {
  res.json({ success: true, message: 'Get all programs', data: [] });
});

router.get('/:id', authorize(['programs', 'all']), (req, res) => {
  res.json({ success: true, message: 'Get program by ID', data: {} });
});

router.post('/', authorize(['programs', 'all']), (req, res) => {
  res.json({ success: true, message: 'Create program', data: {} });
});

router.put('/:id', authorize(['programs', 'all']), (req, res) => {
  res.json({ success: true, message: 'Update program', data: {} });
});

router.delete('/:id', authorize(['programs', 'all']), (req, res) => {
  res.json({ success: true, message: 'Delete program' });
});

export default router;