import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Announcement management routes
router.get('/', authorize(['announcements', 'all']), (req, res) => {
  res.json({ success: true, message: 'Get all announcements', data: [] });
});

router.get('/:id', authorize(['announcements', 'all']), (req, res) => {
  res.json({ success: true, message: 'Get announcement by ID', data: {} });
});

router.post('/', authorize(['announcements', 'all']), (req, res) => {
  res.json({ success: true, message: 'Create announcement', data: {} });
});

router.put('/:id', authorize(['announcements', 'all']), (req, res) => {
  res.json({ success: true, message: 'Update announcement', data: {} });
});

router.post('/:id/send', authorize(['announcements', 'all']), (req, res) => {
  res.json({ success: true, message: 'Send announcement', data: {} });
});

router.delete('/:id', authorize(['announcements', 'all']), (req, res) => {
  res.json({ success: true, message: 'Delete announcement' });
});

export default router;