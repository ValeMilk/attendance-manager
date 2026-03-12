import { Router } from 'express';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth.js';
import { MonthStatus } from '../models/MonthStatus.js';

const router = Router();

// Get all month statuses (for admin dashboard)
router.get('/', authenticateJWT, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const statuses = await MonthStatus.find({})
      .select('month isLocked unlockedBy unlockedAt lockedAt')
      .sort({ month: -1 })
      .lean();
    res.json(statuses);
  } catch (e) {
    console.error('Failed to fetch month statuses', e);
    res.status(500).json({ message: 'Failed to fetch month statuses' });
  }
});

// Get status for a specific month (all users can check)
router.get('/:month', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { month } = req.params;
    // Find or create default status (unlocked = false means locked)
    let status = await MonthStatus.findOne({ month }).lean();
    
    if (!status) {
      // Auto-create as locked
      await MonthStatus.create({
        month,
        isLocked: true,
        unlockedBy: null,
        unlockedAt: null,
      });
      status = await MonthStatus.findOne({ month }).lean();
    }
    
    res.json(status);
  } catch (e) {
    console.error('Failed to fetch month status', e);
    res.status(500).json({ message: 'Failed to fetch month status' });
  }
});

// Admin: Unlock a month (allow supervisors to edit)
router.post('/:month/unlock', authenticateJWT, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { month } = req.params;
    
    const status = await MonthStatus.findOneAndUpdate(
      { month },
      {
        $set: {
          isLocked: false,
          unlockedBy: req.userId,
          unlockedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    ).select('month isLocked unlockedBy unlockedAt');
    
    res.json({ ok: true, status });
  } catch (e) {
    console.error('Failed to unlock month', e);
    res.status(500).json({ message: 'Failed to unlock month' });
  }
});

// Admin: Lock a month (prevent supervisors from editing)
router.post('/:month/lock', authenticateJWT, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { month } = req.params;
    
    const status = await MonthStatus.findOneAndUpdate(
      { month },
      {
        $set: {
          isLocked: true,
          unlockedBy: null,
          unlockedAt: null,
          lockedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    ).select('month isLocked unlockedBy unlockedAt lockedAt');
    
    res.json({ ok: true, status });
  } catch (e) {
    console.error('Failed to lock month', e);
    res.status(500).json({ message: 'Failed to lock month' });
  }
});

export default router;
