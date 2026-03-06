import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models/User';

dotenv.config();
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance-manager';

async function run() {
  await mongoose.connect(mongoUri, { family: 4 });
  const list = await User.find({}).lean();
  console.log('Users:', list.length);
  for (const u of list) {
    console.log({ _id: u._id, name: u.name, email: u.email, role: u.role, supervisorId: u.supervisorId });
  }
  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
