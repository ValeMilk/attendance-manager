import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { AttendanceRecord } from '../src/models/AttendanceRecord';
import { Employee } from '../src/models/Employee';

dotenv.config();
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance-manager';

function slugify(s: string) {
  return String(s || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
}

async function run() {
  await mongoose.connect(mongoUri, { family: 4 });
  console.log('Connected to MongoDB');

  const recs = await AttendanceRecord.find({}).lean();
  console.log('Attendance records found:', recs.length);

  let created = 0, skipped = 0;
  for (const r of recs) {
    try {
      const sup = r.supervisorId || (r.employeeId && r.employeeId.includes('-') ? r.employeeId.split('-')[0] : '');
      const name = r.employeeName || (r.employeeId && r.employeeId.includes('-') ? r.employeeId.split('-').slice(1).join('-') : r.employeeId || 'employee');
      const slug = slugify(name || 'employee');
      if (!sup) { skipped++; continue; }
      const q = { supervisorId: sup, slug };
      const update = { $set: { name, displayName: name } };
      const res = await Employee.findOneAndUpdate(q, update, { upsert: true, new: true, setDefaultsOnInsert: true });
      if (res) created++;
    } catch (e) {
      console.warn('Failed to upsert employee for record', r._id, e.message || e);
    }
  }

  console.log(`Migration complete. Created/Upserted: ${created}, Skipped: ${skipped}`);
  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
