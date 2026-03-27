import { Router } from 'express';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth.js';
import { AuditLog } from '../models/AuditLog.js';

const router = Router();

// GET /api/audit-logs - Admin only: list audit logs with optional filters
router.get('/', authenticateJWT, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { action, userId, startDate, endDate, limit: qLimit, page: qPage } = req.query;

    const filter: any = {};

    if (action) filter.action = String(action);
    if (userId) filter.userId = String(userId);
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(String(startDate));
      if (endDate) filter.createdAt.$lte = new Date(String(endDate) + 'T23:59:59.999Z');
    }

    const limit = Math.min(parseInt(String(qLimit || '100')), 500);
    const page = Math.max(parseInt(String(qPage || '1')), 1);
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    console.error('Failed to fetch audit logs', e);
    res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
});

export default router;
