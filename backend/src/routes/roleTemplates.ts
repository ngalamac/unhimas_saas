import express from 'express';
import RoleTemplate from '../models/RoleTemplate';
import { rolePermissionTemplates, RoleType } from '../lib/rolePermissions';
import { authMiddleware, requirePermission, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all role templates (fallback to code defaults when DB empty)
router.get('/', authMiddleware, requirePermission(['all:read','users:read']), async (_req: AuthRequest, res) => {
  try {
    const templates = await RoleTemplate.find({}).lean();
    const merged = Object.keys(rolePermissionTemplates).map((role) => {
      const db = templates.find(t => t.role === role);
      return {
        role,
        permissions: db?.permissions || (rolePermissionTemplates as any)[role],
        isDefault: db?.isDefault ?? true,
        updatedAt: db?.updatedAt || null,
      };
    });
    res.json({ data: merged });
  } catch (e: any) {
    res.status(500).json({ error: { message: 'Failed to fetch role templates' } });
  }
});

// Set/replace default template for a role
router.put('/:role', authMiddleware, requirePermission(['all:write','users:manage']), async (req: AuthRequest, res) => {
  try {
    const role = (req.params.role || '').toString() as RoleType;
    const perms = req.body?.permissions || {};
    if (!role || !(role in rolePermissionTemplates)) {
      return res.status(400).json({ error: { message: 'Invalid role' } });
    }

    const updated = await RoleTemplate.findOneAndUpdate(
      { role },
      { role, permissions: perms, isDefault: true },
      { new: true, upsert: true }
    ).lean();

    res.json({ data: updated });
  } catch (e: any) {
    res.status(500).json({ error: { message: 'Failed to save role template' } });
  }
});

export default router;
