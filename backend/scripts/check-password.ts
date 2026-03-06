import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User } from '../src/models/User';

dotenv.config();
try{ dns.setServers(['8.8.8.8','1.1.1.1']); }catch(e){}
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance-manager';

async function run() {
  await mongoose.connect(mongoUri, { family: 4 });
  const email = process.argv[2] || 'mariana@attendance.com';
  const pwd = process.argv[3] || 'mariana123';
  const user = await User.findOne({ email }).lean();
  if (!user) {
    console.log('User not found:', email);
    await mongoose.disconnect();
    return;
  }
  console.log('Found user:', user.email, 'role:', user.role);
  const match = await bcrypt.compare(pwd, (user as any).password || '');
  console.log('Password match:', match);
  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
