import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';
dotenv.config();
try{ dns.setServers(['8.8.8.8','1.1.1.1']); }catch(e){}
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance-manager';

import('./../src/models/User.js').then(async ({ User })=>{
  try{
    await mongoose.connect(mongoUri, { family:4 });
    const u = await User.findOne({ email: 'admin@attendance.com' }).lean();
    console.log('admin user:', u ? { email: u.email, role: u.role, name: u.name } : 'NOT FOUND');
    await mongoose.disconnect();
  }catch(e){ console.error('ERR', e); process.exit(1); }
}).catch(e=>{ console.error('Import Error', e); process.exit(1); });
