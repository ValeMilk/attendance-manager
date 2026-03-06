import { Router } from 'express';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth.js';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { Justification } from '../models/Justification.js';
import { User } from '../models/User.js';
import { Employee } from '../models/Employee.js';

// simple slug helper
function slugify(s: string) {
  return String(s || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
}

const router = Router();

// Upsert multiple attendance records
router.post('/', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const records: any[] = req.body.records || [];
    if (!Array.isArray(records)) return res.status(400).json({ message: 'Invalid payload' });

    const ops = records.map(r => {
      const rawEmployeeId: string = r.employeeId || '';
      const providedName: string = r.employeeName || '';
      const supFromId = rawEmployeeId && rawEmployeeId.includes('-') ? rawEmployeeId.split('-')[0] : '';
      const supervisorId = (r.supervisorId || supFromId || (req.user && (req.user as any).supervisorId) || '').toString();
      const nameForSlug = providedName || (rawEmployeeId && rawEmployeeId.includes('-') ? rawEmployeeId.split('-').slice(1).join('-') : rawEmployeeId);
      const slug = slugify(nameForSlug || 'employee');
      const canonicalId = `${supervisorId}-${slug}`;

      return {
        canonicalId,
        day: r.day,
        apontador: r.apontador || '',
        supervisor: r.supervisor || '',
        createdBy: req.userId,
        supervisorId: supervisorId,
        employeeName: providedName || nameForSlug || slug,
      };
    });

    for (const r of ops) {
      // ensure canonical employee exists
      try {
        await Employee.findOneAndUpdate({ supervisorId: r.supervisorId, slug: slugify(r.employeeName || r.canonicalId) }, { $set: { name: r.employeeName, displayName: r.employeeName } }, { upsert: true });
      } catch (e) {
        // ignore employee upsert errors
      }

      await AttendanceRecord.findOneAndUpdate(
        { employeeId: r.canonicalId, day: r.day },
        { $set: { apontador: r.apontador, supervisor: r.supervisor, createdBy: r.createdBy, supervisorId: r.supervisorId, employeeName: r.employeeName } },
        { upsert: true }
      );
    }

    res.json({ ok: true, saved: ops.length });
  } catch (e) {
    console.error('Failed to save attendance:', e);
    res.status(500).json({ message: 'Failed to save attendance' });
  }
});

// Get attendance records. If supervisorId provided, return records for that supervisor's employees (employeeId prefix).
router.get('/', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { supervisorId } = req.query;
    const role = req.user?.role;

    if (role === 'supervisor') {
      // supervisors see their own records and also global records (shared employees)
      const user = await User.findById(req.userId).lean();
      if (!user) return res.status(404).json({ message: 'User not found' });
      const prefix = user._id.toString();
        const all = await AttendanceRecord.find({}).lean();
        // Only show records that were last saved/created by an admin user.
        // Fetch admin user ids and filter attendance records by their `createdBy` field.
        const admins = await User.find({ role: 'admin' }).select('_id').lean();
        const adminIds = new Set((admins || []).map(a => a._id.toString()));

        const filtered = all.filter(r => {
          const matchesSupervisorScope = (
            (r.supervisorId && (r.supervisorId === user.supervisorId || r.supervisorId === 'global')) ||
            (r.employeeId && r.employeeId.startsWith(prefix)) ||
            (r.employeeId && (r.employeeId.startsWith((user.supervisorId || '')) || (user.supervisorId && r.employeeId.includes(user.supervisorId))))
          );
          const createdById = r.createdBy ? String(r.createdBy) : '';
          const createdByIsAdmin = createdById && adminIds.has(createdById);
          return matchesSupervisorScope && createdByIsAdmin;
        });

        return res.json(filtered);
    }

    if (role === 'admin' || role === 'expectador') {
      // Allow admin and expectador to request optionally by supervisorId
      if (supervisorId) {
        const sup = (supervisorId as string);
        const recs = await AttendanceRecord.find({ employeeId: new RegExp(`^${sup}-`) }).lean();
        return res.json(recs);
      }
      const recs = await AttendanceRecord.find({}).lean();
      return res.json(recs);
    }

    res.status(403).json({ message: 'Insufficient permissions' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to fetch attendance' });
  }
});

// Justifications endpoints
router.post('/justifications', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { justifications } = req.body;
    if (!Array.isArray(justifications)) return res.status(400).json({ message: 'Invalid payload' });
    for (const j of justifications) {
      await Justification.findOneAndUpdate({ employeeId: j.employeeId, day: j.day }, { $set: { text: j.text, createdBy: req.userId } }, { upsert: true });
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('Failed to save justifications', e);
    res.status(500).json({ message: 'Failed to save justifications' });
  }
});

router.get('/justifications', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { supervisorId } = req.query;
    const role = req.user?.role;
    if (role === 'supervisor') {
      const user = await User.findById(req.userId).lean();
      const all = await Justification.find({}).lean();
      const filtered = all.filter(j => j.employeeId.startsWith(user.supervisorId || ''));
      return res.json(filtered);
    }
    if (role === 'admin' || role === 'expectador') {
      if (supervisorId) {
        const sup = supervisorId as string;
        const list = await Justification.find({ employeeId: new RegExp(`^${sup}-`) }).lean();
        return res.json(list);
      }
      const all = await Justification.find({}).lean();
      return res.json(all);
    }
    res.status(403).json({ message: 'Insufficient permissions' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to fetch justifications' });
  }
});

// Admin-only maintenance: populate supervisorId for existing records derived from employeeId
router.post('/fix-supervisor-ids', authenticateJWT, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const recs = await AttendanceRecord.find({ $or: [{ supervisorId: { $exists: false } }, { supervisorId: '' }] }).lean();
    for (const r of recs) {
      if (r.employeeId && r.employeeId.includes('-')) {
        const sup = r.employeeId.split('-')[0];
        await AttendanceRecord.updateOne({ _id: r._id }, { $set: { supervisorId: sup } });
      }
    }
    res.json({ ok: true, processed: recs.length });
  } catch (e) {
    console.error('Failed to fix supervisorIds', e);
    res.status(500).json({ message: 'Failed to fix supervisorIds' });
  }
});

export default router;

