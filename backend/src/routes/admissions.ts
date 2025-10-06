import express from 'express';
import authMiddleware, { requirePermission, requireBranchAccess, AuthRequest } from '../middleware/auth';
import AdmissionApplication from '../models/AdmissionApplication';
import Program from '../models/Program';

const router = express.Router();

// List admissions with filters and branch isolation
router.get('/', authMiddleware, requireBranchAccess(), requirePermission(['students:read','admissions','admissions:read']), async (req: AuthRequest, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 20)));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (!req.user?.isSuperAdmin && req.user?.branch) filter.branch = req.user.branch;
    else if (req.query.branch) filter.branch = String(req.query.branch);
    if (req.query.status) filter.status = String(req.query.status);
    if (req.query.program) filter.program = String(req.query.program);
    if (req.query.search) {
      const re = new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [ { applicantName: re }, { email: re }, { phone: re } ];
    }

    const [total, data] = await Promise.all([
      AdmissionApplication.countDocuments(filter),
      AdmissionApplication.find(filter)
        .populate('program', 'name type')
        .populate('branch', 'name')
        .sort({ applicationDate: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    res.json({ data, meta: { total, page, limit } });
  } catch (e: any) {
    res.status(500).json({ error: { message: 'Failed to fetch admissions', details: e?.message } });
  }
});

// Create admission application
router.post('/', authMiddleware, requireBranchAccess(), requirePermission(['students:create','admissions:create']), async (req: AuthRequest, res) => {
  try {
    const { applicantName, email, phone, program, documents, feesPaid, notes, branch } = req.body || {};
    if (!applicantName || !email || !phone || !program) return res.status(400).json({ error: { message: 'Missing required fields' } });
    const prog = await Program.findById(program);
    if (!prog) return res.status(400).json({ error: { message: 'Invalid program' } });

    // Branch: enforce requester branch for non-superadmin
    let branchId = branch;
    if (!req.user?.isSuperAdmin) branchId = req.user?.branch;
    if (!branchId) return res.status(400).json({ error: { message: 'Branch is required' } });

    const app = await AdmissionApplication.create({
      applicantName,
      email,
      phone,
      program,
      branch: branchId,
      documents: Array.isArray(documents) ? documents : [],
      feesPaid: Boolean(feesPaid),
      notes,
      createdBy: req.user?.id,
    });

    const created = await AdmissionApplication.findById(app._id).populate('program','name type').populate('branch','name');
    res.status(201).json({ data: created });
  } catch (e: any) {
    res.status(500).json({ error: { message: 'Failed to create application', details: e?.message } });
  }
});

// Update status (approve/reject)
router.post('/:id/status', authMiddleware, requireBranchAccess(), requirePermission(['students:update','admissions:update']), async (req: AuthRequest, res) => {
  try {
    const { status } = req.body || {};
    if (!['Approved','Rejected','Pending'].includes(String(status))) return res.status(400).json({ error: { message: 'Invalid status' } });

    const updated = await AdmissionApplication.findByIdAndUpdate(req.params.id, { status: String(status) }, { new: true })
      .populate('program','name type')
      .populate('branch','name');
    if (!updated) return res.status(404).json({ error: { message: 'Application not found' } });
    res.json({ data: updated });
  } catch (e: any) {
    res.status(500).json({ error: { message: 'Failed to update status', details: e?.message } });
  }
});

// Stats for Registrar KPIs
router.get('/stats', authMiddleware, requireBranchAccess(), requirePermission(['students:read','admissions:read']), async (req: AuthRequest, res) => {
  try {
    const match: any = {};
    if (!req.user?.isSuperAdmin && req.user?.branch) match.branch = req.user.branch;
    else if (req.query.branch) match.branch = String(req.query.branch);

    const [total, pending, approved, rejected] = await Promise.all([
      AdmissionApplication.countDocuments(match),
      AdmissionApplication.countDocuments({ ...match, status: 'Pending' }),
      AdmissionApplication.countDocuments({ ...match, status: 'Approved' }),
      AdmissionApplication.countDocuments({ ...match, status: 'Rejected' }),
    ]);

    res.json({ data: { total, pending, approved, rejected } });
  } catch (e: any) {
    res.status(500).json({ error: { message: 'Failed to compute stats', details: e?.message } });
  }
});

export default router;
