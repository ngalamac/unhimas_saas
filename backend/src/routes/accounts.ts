import express from 'express';
import Account from '../models/Account';
import { requirePermission } from '../middleware/auth';

const router = express.Router();

// list accounts
router.get('/', async (req, res) => {
  try {
    const accounts = await Account.find().sort({ name: 1 });
    res.json(accounts);
  } catch (err) {
    console.error('GET /api/accounts error', err);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// create account
router.post('/', requirePermission('accounting'), async (req, res) => {
  try {
    const { name, code, type, description, parent } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'Missing required fields' });
    const acc = new Account({ name, code, type, description, parent });
    await acc.save();
    res.status(201).json(acc);
  } catch (err) {
    console.error('POST /api/accounts error', err);
    res.status(400).json({ error: 'Failed to create account' });
  }
});

export default router;
