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

function inferSupervisorIdFromEmployeeId(employeeId: string, knownSupervisorIds: string[]) {
  const raw = String(employeeId || '').trim();
  if (!raw) return '';

  const sorted = [...(knownSupervisorIds || [])]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  for (const supervisorId of sorted) {
    if (raw === supervisorId || raw.startsWith(`${supervisorId}-`)) {
      return supervisorId;
    }
  }

  return raw.includes('-') ? raw.split('-')[0] : raw;
}

const router = Router();

// Upsert multiple attendance records
router.post('/', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const records: any[] = req.body.records || [];
    if (!Array.isArray(records)) return res.status(400).json({ message: 'Invalid payload' });

    const knownSupervisorIds = (
      await User.find({ role: 'supervisor' }).select('supervisorId').lean()
    )
      .map((u: any) => String(u?.supervisorId || '').trim())
      .filter(Boolean);

    const ops = records.map(r => {
      const rawEmployeeId: string = r.employeeId || '';
      const providedName: string = r.employeeName || '';
      const supFromId = inferSupervisorIdFromEmployeeId(rawEmployeeId, knownSupervisorIds);
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

    if (ops.length === 0) {
      return res.json({ ok: true, saved: 0 });
    }

    // Do not create employees from attendance payload.
    // Only update metadata when the employee already exists.
    try {
      await Employee.bulkWrite(
        ops.map((r) => ({
          updateOne: {
            filter: { supervisorId: r.supervisorId, slug: slugify(r.employeeName || r.canonicalId) },
            update: { $set: { name: r.employeeName, displayName: r.employeeName } },
            upsert: false,
          },
        })),
        { ordered: false }
      );
    } catch (e) {
      // ignore employee upsert errors
    }

    await AttendanceRecord.bulkWrite(
      ops.map((r) => ({
        updateOne: {
          filter: { employeeId: r.canonicalId, day: r.day },
          update: {
            $set: {
              apontador: r.apontador,
              supervisor: r.supervisor,
              createdBy: r.createdBy,
              supervisorId: r.supervisorId,
              employeeName: r.employeeName,
            },
          },
          upsert: true,
        },
      })),
      { ordered: false }
    );

    res.json({ ok: true, saved: ops.length });
  } catch (e) {
    console.error('Failed to save attendance:', e);
    res.status(500).json({ message: 'Failed to save attendance' });
  }
});

// Get attendance records. If supervisorId provided, return records for that supervisor's employees (employeeId prefix).
router.get('/', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { supervisorId, changedOnly, startDay, endDay } = req.query;
    const role = req.user?.role;
    const wantsChangedOnly = String(changedOnly || 'false').toLowerCase() === 'true';
    const inPeriod = (day: string) => {
      if (!day) return false;
      if (startDay && String(day) < String(startDay)) return false;
      if (endDay && String(day) > String(endDay)) return false;
      return true;
    };
    const isChanged = (r: any) => String(r?.apontador || '').trim() !== '' || String(r?.supervisor || '').trim() !== '';

    if (role === 'supervisor') {
      // supervisors see their own records and also global records (shared employees)
      const user = await User.findById(req.userId).lean();
      if (!user) return res.status(404).json({ message: 'User not found' });
      const prefix = user._id.toString();
      const all = await AttendanceRecord.find({}).lean();
      let filtered = all.filter(r => 
        (r.supervisorId && (r.supervisorId === user.supervisorId || r.supervisorId === 'global')) ||
        (r.employeeId && r.employeeId.startsWith(prefix)) ||
        (r.employeeId && (r.employeeId.startsWith((user.supervisorId || '')) || (user.supervisorId && r.employeeId.includes(user.supervisorId))))
      );
      if (startDay || endDay) filtered = filtered.filter(r => inPeriod(String(r.day || '')));
      if (wantsChangedOnly) filtered = filtered.filter(r => isChanged(r));
      return res.json(filtered);
    }

    if (role === 'admin' || role === 'expectador') {
      // Allow admin and expectador to request optionally by supervisorId
      if (supervisorId) {
        const sup = (supervisorId as string);
        let recs = await AttendanceRecord.find({ employeeId: new RegExp(`^${sup}-`) }).lean();
        if (startDay || endDay) recs = recs.filter(r => inPeriod(String(r.day || '')));
        if (wantsChangedOnly) recs = recs.filter(r => isChanged(r));
        return res.json(recs);
      }
      let recs = await AttendanceRecord.find({}).lean();
      if (startDay || endDay) recs = recs.filter(r => inPeriod(String(r.day || '')));
      if (wantsChangedOnly) recs = recs.filter(r => isChanged(r));
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
      if (!user) return res.status(404).json({ message: 'User not found' });
      const all = await Justification.find({}).lean();
      const filtered = all.filter(j => j.employeeId.startsWith((user as any).supervisorId || ''));
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

router.delete('/justifications', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { id, employeeId, day } = req.body || {};
    if (!id && (!employeeId || !day)) {
      return res.status(400).json({ message: 'id or (employeeId and day) are required' });
    }

    const role = req.user?.role;
    if (role === 'expectador') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const deleted = id
      ? await Justification.findByIdAndDelete(String(id))
      : await Justification.findOneAndDelete({
          employeeId: String(employeeId),
          day: String(day),
        });

    res.json({ ok: true, deleted: !!deleted });
  } catch (e) {
    console.error('Failed to delete justification', e);
    res.status(500).json({ message: 'Failed to delete justification' });
  }
});

// Debug endpoint: inspect effective visibility scope for current session/user.
// Useful to diagnose Admin/Supervisor view mismatches without touching UI layout.
router.get('/debug-scope', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const me = await User.findById(req.userId).select('_id name email role supervisorId').lean();
    if (!me) return res.status(404).json({ message: 'User not found' });

    const role = me.role;
    let employeesQuery: any = {};
    let attendance: any[] = [];

    if (role === 'supervisor') {
      employeesQuery = { supervisorId: { $in: [me.supervisorId, 'global'] } };
      const all = await AttendanceRecord.find({}).lean();
      const prefix = me._id.toString();
      attendance = all.filter(r =>
        (r.supervisorId && (r.supervisorId === me.supervisorId || r.supervisorId === 'global')) ||
        (r.employeeId && r.employeeId.startsWith(prefix)) ||
        (r.employeeId && (r.employeeId.startsWith((me.supervisorId || '')) || (me.supervisorId && r.employeeId.includes(me.supervisorId))))
      );
    } else {
      employeesQuery = {};
      attendance = await AttendanceRecord.find({}).lean();
    }

    const employeesList = await Employee.find(employeesQuery).lean();
    const employees = employeesList.map(e => ({
      id: `${e.supervisorId}-${e.slug}`,
      name: e.name,
      supervisorId: e.supervisorId,
    }));

    const employeeIdsFromAttendance = Array.from(new Set(attendance.map(r => r.employeeId).filter(Boolean))).sort();

    res.json({
      user: me,
      employeesCount: employees.length,
      attendanceCount: attendance.length,
      employees,
      employeeIdsFromAttendance,
    });
  } catch (e) {
    console.error('Failed to fetch debug scope', e);
    res.status(500).json({ message: 'Failed to fetch debug scope' });
  }
});

// Admin-only maintenance: populate supervisorId for existing records derived from employeeId
router.post('/fix-supervisor-ids', authenticateJWT, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const recs = await AttendanceRecord.find({ $or: [{ supervisorId: { $exists: false } }, { supervisorId: '' }] }).lean();
    const knownSupervisorIds = (
      await User.find({ role: 'supervisor' }).select('supervisorId').lean()
    )
      .map((u: any) => String(u?.supervisorId || '').trim())
      .filter(Boolean);

    for (const r of recs) {
      if (r.employeeId) {
        const sup = inferSupervisorIdFromEmployeeId(String(r.employeeId), knownSupervisorIds);
        if (!sup) continue;
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

