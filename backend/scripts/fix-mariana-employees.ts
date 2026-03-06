import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { AttendanceRecord } from '../src/models/AttendanceRecord';
import { Employee } from '../src/models/Employee';

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
  console.log('Connected to MongoDB for mariana fix');

  // Find attendance records that reference mariana-moura in name or id
  const pattern = /mariana-moura/i;
  const recs = await AttendanceRecord.find({ $or: [ { employeeName: pattern }, { employeeId: { $regex: pattern } } ] }).lean();
  console.log('Found records referencing mariana-moura:', recs.length);

  let changed = 0;
  for (const r of recs) {
    const name = r.employeeName || (r.employeeId && r.employeeId.includes('-') ? r.employeeId.split('-').slice(1).join('-') : r.employeeId || 'mariana-moura');
    const slug = slugify(name);
    const targetSup = 'mariana';
    const canonicalId = `${targetSup}-${slug}`;

    // Ensure Employee exists for mariana
    await Employee.findOneAndUpdate({ supervisorId: targetSup, slug }, { $set: { name, displayName: name } }, { upsert: true, new: true, setDefaultsOnInsert: true });

    // If there's already a canonical attendance for same day, merge/delete to avoid unique index
    const existingCanon = await AttendanceRecord.findOne({ employeeId: canonicalId, day: r.day }).lean();
    if (existingCanon) {
      console.log(' Canonical exists for day', r.day, 'canon:', existingCanon._id, 'dup:', r._id);
      const rUpdated = r.updatedAt ? new Date(r.updatedAt).getTime() : 0;
      const cUpdated = existingCanon.updatedAt ? new Date(existingCanon.updatedAt).getTime() : 0;
      if (rUpdated > cUpdated) {
        await AttendanceRecord.updateOne({ _id: existingCanon._id }, { $set: { apontador: r.apontador, supervisor: r.supervisor, employeeName: name, supervisorId: targetSup } });
        await AttendanceRecord.deleteOne({ _id: r._id });
        console.log('  Merged into canonical and deleted duplicate', r._id);
      } else {
        await AttendanceRecord.deleteOne({ _id: r._id });
        console.log('  Deleted duplicate', r._id);
      }
      changed++;
    } else {
      // Update record to point to mariana canonical
      await AttendanceRecord.updateOne({ _id: r._id }, { $set: { employeeId: canonicalId, employeeName: name, supervisorId: targetSup } });
      console.log(' Updated record', r._id, '->', canonicalId);
      changed++;
    }
  }

  console.log('Done. Records changed:', changed);
  await mongoose.disconnect();
}

run().catch(e => { console.error('fix-mariana failed', e); process.exit(1); });
