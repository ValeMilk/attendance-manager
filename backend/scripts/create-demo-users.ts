import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User } from '../src/models/User';

dotenv.config();
try { dns.setServers(['8.8.8.8','1.1.1.1']); } catch (e) {}
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance-manager';

const demoUsers = [
  { name: 'ADMIN', email: 'admin@attendance.com', password: 'admin123', role: 'admin' },
  { name: 'MARIANA', email: 'mariana@attendance.com', password: 'mariana123', role: 'supervisor' },
  { name: 'PAULO', email: 'paulo@attendance.com', password: 'paulo123', role: 'supervisor' },
  { name: 'PAULINHO', email: 'paulinho@attendance.com', password: 'paulinho123', role: 'supervisor' },
  { name: 'RODNEY DE MACEDO', email: 'rodney@attendance.com', password: 'rodney123', role: 'supervisor' },
  { name: 'EXPECTADOR', email: 'expectador@attendance.com', password: 'expectador123', role: 'expectador' },
];

async function upsertUsers() {
  await mongoose.connect(mongoUri, { family: 4 });
  console.log('Connected to MongoDB');

  for (const u of demoUsers) {
    const existing = await User.findOne({ email: u.email });
    const hashed = await bcrypt.hash(u.password, 10);
    if (!existing) {
      const doc = new User({
        name: u.name,
        email: u.email,
        password: hashed,
        role: u.role,
        supervisorId: u.role === 'supervisor' ? (u.email.split('@')[0]) : undefined,
        isActive: true,
      });
      await doc.save();
      console.log('Created', u.email);
    } else {
      // update password, role and name to ensure sync
      existing.name = u.name;
      existing.role = u.role as any;
      existing.password = hashed;
      if (u.role === 'supervisor') existing.supervisorId = u.email.split('@')[0];
      existing.isActive = true;
      await existing.save();
      console.log('Updated', u.email);
    }
  }

  await mongoose.disconnect();
  console.log('Done');
}

upsertUsers().catch(e => { console.error(e); process.exit(1); });
