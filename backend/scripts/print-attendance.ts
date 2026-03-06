import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { AttendanceRecord } from '../src/models/AttendanceRecord';

dotenv.config();
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance-manager';

async function run() {
  await mongoose.connect(mongoUri, { family: 4 });
  const recs = await AttendanceRecord.find({}).lean();
  console.log('Attendance records:', recs.length);
  for (const r of recs) {
    console.log({ _id: r._id, day: r.day, employeeId: r.employeeId, employeeName: r.employeeName, supervisorId: r.supervisorId, apontador: r.apontador });
  }
  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
