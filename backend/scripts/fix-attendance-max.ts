import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { AttendanceRecord } from '../src/models/AttendanceRecord';

dotenv.config();
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance-manager';

async function run() {
  await mongoose.connect(mongoUri, { family: 4 });
  console.log('Connected to MongoDB for fix-attendance-max');

  // Find attendance records that mention 'max' but are not canonical 'global-max'
  const pattern = /max/i;
  const recs = await AttendanceRecord.find({ $or: [ { employeeName: pattern }, { employeeId: { $regex: pattern } } ] }).lean();
  console.log('Candidate attendance records matching max:', recs.length);

  let updated = 0;
  for (const r of recs) {
    if (r.employeeId === 'global-max') continue;
    // Check for existing canonical record for same day
    const canon = await AttendanceRecord.findOne({ employeeId: 'global-max', day: r.day }).lean();
    if (canon) {
      console.log(' Found canonical for day', r.day, 'canon:', canon._id, 'dup:', r._id);
      // Decide which record to keep based on updatedAt (prefer newer)
      const rUpdated = r.updatedAt ? new Date(r.updatedAt).getTime() : 0;
      const cUpdated = canon.updatedAt ? new Date(canon.updatedAt).getTime() : 0;
      if (rUpdated > cUpdated) {
        // copy values from r into canonical, then delete r
        await AttendanceRecord.updateOne({ _id: canon._id }, { $set: { apontador: r.apontador, supervisor: r.supervisor, employeeName: 'Max', supervisorId: 'global' } });
        await AttendanceRecord.deleteOne({ _id: r._id });
        console.log('  Merged: updated canonical and deleted duplicate', r._id);
      } else {
        // canonical is newer — just delete duplicate
        await AttendanceRecord.deleteOne({ _id: r._id });
        console.log('  Deleted duplicate', r._id);
      }
      updated++;
    } else {
      // No canonical exists — safe to update
      console.log(' Updating', r._id, 'from', r.employeeId, '-> global-max');
      await AttendanceRecord.updateOne({ _id: r._id }, { $set: { employeeId: 'global-max', employeeName: 'Max', supervisorId: 'global' } });
      updated++;
    }
  }

  console.log('Updated records count:', updated);
  await mongoose.disconnect();
}

run().catch(e => { console.error('fix failed', e); process.exit(1); });
