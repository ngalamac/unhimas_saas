import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Batch management routes
router.get('/', authorize(['all']), (req, res) => {
  res.json({ success: true, message: 'Get all batches', data: [] });
});

router.get('/current', authorize(['all']), (req, res) => {
  res.json({ success: true, message: 'Get current batch', data: {} });
});

router.post('/', authorize(['all']), (req, res) => {
  res.json({ success: true, message: 'Create batch', data: {} });
});

router.put('/:id/activate', authorize(['all']), (req, res) => {
  res.json({ success: true, message: 'Activate batch', data: {} });
});

router.delete('/:id', authorize(['all']), (req, res) => {
  res.json({ success: true, message: 'Delete batch' });
});

export default router;