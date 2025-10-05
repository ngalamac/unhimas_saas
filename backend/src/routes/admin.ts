import express from 'express';
import mongoose from 'mongoose';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { resetDatabase, ResetMode } from '../services/resetService';

const router = express.Router();

// SuperAdmin guard
function requireSuperAdmin(req: AuthRequest, res: any, next: any) {
  if (!req.user || !req.user.isSuperAdmin) {
    return res.status(403).json({ error: { message: 'SuperAdmin only' } });
  }
  return next();
}

// POST /api/admin/reset-database
// Body: { mode: 'soft'|'hard', includeGridfs?: boolean, preserveEmails?: string[], apply?: boolean, confirmToken?: string }
router.post('/reset-database', authMiddleware, requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { mode, includeGridfs, preserveEmails, apply, confirmToken } = req.body || {};

    const MANDATORY_TOKEN = process.env.RESET_CONFIRM_TOKEN || '';
    if (MANDATORY_TOKEN) {
      if (!confirmToken || confirmToken !== MANDATORY_TOKEN) {
        return res.status(400).json({ error: { message: 'Missing or invalid confirm token' } });
      }
    }

    if (!mode || (mode !== 'soft' && mode !== 'hard')) {
      return res.status(400).json({ error: { message: 'Invalid mode. Use soft|hard' } });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: { message: 'Database not connected' } });
    }

    const result = await resetDatabase({
      mode: mode as ResetMode,
      dryRun: !apply,
      includeGridfs: Boolean(includeGridfs),
      preserveEmails: Array.isArray(preserveEmails) ? preserveEmails : [],
    });

    res.status(200).json({ data: result });
  } catch (err: any) {
    console.error('POST /api/admin/reset-database error', err);
    res.status(500).json({ error: { message: err?.message || 'Failed to reset database' } });
  }
});

export default router;
