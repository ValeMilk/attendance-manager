import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Employee } from '../src/models/Employee';

dotenv.config();
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance-manager';

async function run() {
  await mongoose.connect(mongoUri, { family: 4 });
  const list = await Employee.find({}).lean();
  console.log('Employees:', list.length);
  for (const e of list) {
    console.log({ _id: e._id, supervisorId: e.supervisorId, slug: e.slug, name: e.name, displayName: e.displayName, createdAt: e.createdAt, updatedAt: e.updatedAt });
  }
  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
