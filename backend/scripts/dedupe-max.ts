import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Employee } from '../src/models/Employee';
import { AttendanceRecord } from '../src/models/AttendanceRecord';

dotenv.config();
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance-manager';

function slugify(s: string) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-');
}

async function run() {
  await mongoose.connect(mongoUri, { family: 4 });
  console.log('Connected to MongoDB for dedupe');

  const employees = await Employee.find({}).lean();
  console.log('Employees loaded:', employees.length);

  // Group by supervisorId + normalized slug of name
  const groups: Record<string, any[]> = {};
  for (const e of employees) {
    const norm = slugify(e.name || e.displayName || e.slug || '');
    const key = `${e.supervisorId}::${norm}`;
    groups[key] = groups[key] || [];
    groups[key].push(e);
  }

  let totalMerged = 0;
  for (const key of Object.keys(groups)) {
    const list = groups[key];
    if (list.length <= 1) continue;

    console.log('\nFound duplicate group:', key, 'count=', list.length);

    // Choose canonical: prefer one with displayName or most recently updated
    list.sort((a, b) => {
      const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return tb - ta;
    });
    const canonical = list[0];
    const canonicalIdString = `${canonical.supervisorId}-${canonical.slug}`;

    const duplicates = list.slice(1);
    for (const dup of duplicates) {
      const dupIdString = `${dup.supervisorId}-${dup.slug}`;
      console.log(' Merging duplicate', dup._id, '->', canonical._id, ' (', dupIdString, '->', canonicalIdString, ')');

      // Update AttendanceRecord entries that reference the duplicate
      // Match by employeeId equal to dupIdString OR employeeId containing dup.slug OR employeeName similar
      const slugPattern = new RegExp(dup.slug || slugify(dup.name || ''), 'i');

      const q: any = {
        $or: [
          { employeeId: dupIdString },
          { employeeId: { $regex: slugPattern } },
          { employeeName: { $regex: slugPattern } },
        ],
      };

      const update = {
        $set: {
          employeeId: canonicalIdString,
          employeeName: canonical.name || canonical.displayName || canonical.slug,
          supervisorId: canonical.supervisorId,
        },
      };

      const res = await AttendanceRecord.updateMany(q, update);
      console.log('  Attendance updated:', res.matchedCount || res.n || res.modifiedCount || 0);

      // Remove duplicate Employee doc
      await Employee.deleteOne({ _id: dup._id });
      console.log('  Deleted duplicate employee document', dup._id);
      totalMerged++;
    }
  }

  console.log('\nDeduplication complete. Total duplicate groups merged:', totalMerged);
  await mongoose.disconnect();
}

run().catch(e => { console.error('Dedupe failed', e); process.exit(1); });
