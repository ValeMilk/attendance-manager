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
    console.log(`🔍 Checking status for month: ${month}`);
    
    // Find or create default status (unlocked = false means locked)
    let status = await MonthStatus.findOne({ month }).lean();
    
    if (!status) {
      console.log(`📝 Creating new locked MonthStatus for: ${month}`);
      // Auto-create as locked
      await MonthStatus.create({
        month,
        isLocked: true,
        unlockedBy: null,
        unlockedAt: null,
      });
      status = await MonthStatus.findOne({ month }).lean();
    }
    
    console.log(`📊 Month status for ${month}:`, status);
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
    console.log(`🔓 Unlocking month: ${month} by admin: ${req.userId}`);
    
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
    
    console.log(`✅ Month unlocked successfully:`, status);
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
    console.log(`🔒 Locking month: ${month} by admin: ${req.userId}`);
    
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
    
    console.log(`✅ Month locked successfully:`, status);
    res.json({ ok: true, status });
  } catch (e) {
    console.error('Failed to lock month', e);
    res.status(500).json({ message: 'Failed to lock month' });
  }
});

// Helper: given a period month (e.g. "2026-01"), returns both calendar months it spans (26/01 - 25/02 => ["2026-01", "2026-02"])
function getPeriodMonths(month: string): [string, string] {
  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr);
  const mon = parseInt(monthStr);
  const nextMonth = mon === 12 ? 1 : mon + 1;
  const nextYear = mon === 12 ? year + 1 : year;
  return [month, `${nextYear}-${String(nextMonth).padStart(2, '0')}`];
}

// Admin: Unlock a period (unlocks both calendar months that the period spans)
router.post('/:month/unlock-period', authenticateJWT, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { month } = req.params;
    const [month1, month2] = getPeriodMonths(month);
    console.log(`🔓 Unlocking period: ${month1} + ${month2} by admin: ${req.userId}`);

    const updateData = {
      $set: {
        isLocked: false,
        unlockedBy: req.userId,
        unlockedAt: new Date(),
      },
    };

    await Promise.all([
      MonthStatus.findOneAndUpdate({ month: month1 }, updateData, { upsert: true, new: true }),
      MonthStatus.findOneAndUpdate({ month: month2 }, updateData, { upsert: true, new: true }),
    ]);

    console.log(`✅ Period unlocked: ${month1} + ${month2}`);
    res.json({ ok: true, months: [month1, month2] });
  } catch (e) {
    console.error('Failed to unlock period', e);
    res.status(500).json({ message: 'Failed to unlock period' });
  }
});

// Admin: Lock a period (locks both calendar months that the period spans)
router.post('/:month/lock-period', authenticateJWT, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { month } = req.params;
    const [month1, month2] = getPeriodMonths(month);
    console.log(`🔒 Locking period: ${month1} + ${month2} by admin: ${req.userId}`);

    const updateData = {
      $set: {
        isLocked: true,
        unlockedBy: null,
        unlockedAt: null,
        lockedAt: new Date(),
      },
    };

    await Promise.all([
      MonthStatus.findOneAndUpdate({ month: month1 }, updateData, { upsert: true, new: true }),
      MonthStatus.findOneAndUpdate({ month: month2 }, updateData, { upsert: true, new: true }),
    ]);

    console.log(`✅ Period locked: ${month1} + ${month2}`);
    res.json({ ok: true, months: [month1, month2] });
  } catch (e) {
    console.error('Failed to lock period', e);
    res.status(500).json({ message: 'Failed to lock period' });
  }
});

// Get status for a period (both months must be unlocked for the period to be unlocked)
router.get('/:month/period-status', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { month } = req.params;
    const [month1, month2] = getPeriodMonths(month);

    const [status1, status2] = await Promise.all([
      MonthStatus.findOne({ month: month1 }).lean(),
      MonthStatus.findOne({ month: month2 }).lean(),
    ]);

    // Period is locked if EITHER month is locked (or doesn't exist yet = default locked)
    const isLocked = (status1?.isLocked ?? true) || (status2?.isLocked ?? true);

    res.json({ month, months: [month1, month2], isLocked });
  } catch (e) {
    console.error('Failed to fetch period status', e);
    res.status(500).json({ message: 'Failed to fetch period status' });
  }
});

export default router;
