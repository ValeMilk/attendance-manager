import { Router } from 'express';
import { Employee } from '../models/Employee.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/employees?supervisorId=...
router.get('/', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { supervisorId } = req.query;
    const q: any = {};
    if (supervisorId) q.supervisorId = String(supervisorId);
    const list = await Employee.find(q).lean();
    const mapped = list.map(e => ({ id: `${e.supervisorId}-${e.slug}`, name: e.name, supervisorId: e.supervisorId }));
    res.json(mapped);
  } catch (e) {
    console.error('Failed to fetch employees', e);
    res.status(500).json({ message: 'Failed to fetch employees' });
  }
});

export default router;
