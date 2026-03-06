import mongoose from 'mongoose';
import { AttendanceRecord } from '../src/models/AttendanceRecord.js';
import dotenv from 'dotenv';
dotenv.config();

async function main(){
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance-manager';
  try{
    // force DNS servers to avoid local resolver failures
    (require('dns') as typeof import('dns')).setServers(['8.8.8.8','1.1.1.1']);
  }catch(e){}
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 30000 });
  console.log('Connected to DB');
  const recs = await AttendanceRecord.find({ $or: [{ supervisorId: { $exists: false } }, { supervisorId: '' }] }).lean();
  console.log('To process', recs.length);
  for(const r of recs){
    if(r.employeeId && r.employeeId.includes('-')){
      const sup = r.employeeId.split('-')[0];
      await AttendanceRecord.updateOne({ _id: r._id }, { $set: { supervisorId: sup } });
      console.log('Updated', r._id, '->', sup);
    }
  }
  console.log('Done');
  process.exit(0);
}

main().catch(e=>{ console.error(e); process.exit(1); });
