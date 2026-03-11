import dotenv from 'dotenv';
import dns from 'dns';
import mongoose from 'mongoose';
import { AttendanceRecord } from '../src/models/AttendanceRecord.js';

dotenv.config();
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch {}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || '');

  const records = await AttendanceRecord.find({
    employeeId: { $in: ['global-max', 'mariana-moura-max-felix-monteiro'] },
  })
    .sort({ day: 1 })
    .lean();

  console.log(
    JSON.stringify(
      records.map((r: any) => ({
        _id: r._id,
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        day: r.day,
        apontador: r.apontador,
        supervisor: r.supervisor,
        supervisorId: r.supervisorId,
      })),
      null,
      2
    )
  );

  await mongoose.disconnect();
}

run().catch(async (e) => {
  console.error(e);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
