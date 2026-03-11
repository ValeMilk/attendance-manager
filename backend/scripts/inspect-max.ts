import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dns from 'dns';
import { Employee } from '../src/models/Employee.js';
import { AttendanceRecord } from '../src/models/AttendanceRecord.js';

dotenv.config();
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch {}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || '');

  const emps = await Employee.find({ name: /max/i }).lean();
  const atts = await AttendanceRecord.find({ employeeId: /max/i }).lean();

  console.log('Employees(max):', emps.map((e: any) => ({
    id: `${e.supervisorId}-${e.slug}`,
    name: e.name,
    supervisorId: e.supervisorId,
  })));

  console.log('Attendance IDs(max):', Array.from(new Set(atts.map((a: any) => a.employeeId))).sort());
  console.log('Attendance count(max):', atts.length);

  await mongoose.disconnect();
}

run().catch(async (e) => {
  console.error(e);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
