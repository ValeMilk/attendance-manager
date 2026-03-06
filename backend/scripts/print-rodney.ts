import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models/User';

dotenv.config();
try{ dns.setServers(['8.8.8.8','1.1.1.1']); }catch(e){}
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance-manager';

async function run(){
  await mongoose.connect(mongoUri, { family:4 });
  const rodney = await User.findOne({ name: 'RODNEY DE MACEDO' }).lean();
  console.log('RODNEY:', rodney);
  const rodneyId = rodney?.supervisorId || rodney?._id;
  const supervisors = await User.find({ role: 'supervisor' }).lean();
  console.log('Supervisors count:', supervisors.length);
  supervisors.forEach(s => console.log(s.name, '-> supervisorId:', s.supervisorId));
  await mongoose.disconnect();
}

run().catch(e=>{ console.error(e); process.exit(1); });
