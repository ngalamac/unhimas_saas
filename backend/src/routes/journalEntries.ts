import express from 'express';
import JournalEntry from '../models/JournalEntry';
import { authMiddleware, requirePermission, AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

const router = express.Router();

// Get all journal entries with filtering and pagination
router.get('/', authMiddleware, requirePermission('accounting.read'), async (req: AuthRequest, res) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1'));
    const limit = Math.max(10, parseInt((req.query.limit as string) || '50'));
    const skip = (page - 1) * limit;

    const filter: any = {};

    // Branch filtering
    if (!req.user?.isSuperAdmin && req.user?.branch) {
      filter.branch = req.user.branch;
    } else if (req.query.branch) {
      filter.branch = new mongoose.Types.ObjectId(req.query.branch as string);
    }

    // Date filtering
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = new Date(req.query.from as string);
      if (req.query.to) filter.date.$lte = new Date(req.query.to as string);
    }

    // Account filtering
    if (req.query.account) {
        filter['lines.account'] = new mongoose.Types.ObjectId(req.query.account as string);
    }

    const total = await JournalEntry.countDocuments(filter);
    const entries = await JournalEntry.find(filter)
      .populate('branch', 'name')
      .populate('createdBy', 'name email')
      .populate('lines.account', 'name type')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({ data: entries, meta: { total, page, limit } });
  } catch (err) {
    console.error('GET /api/journal-entries error', err);
    res.status(500).json({ error: 'Failed to fetch journal entries' });
  }
});

export default router;
