import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models/User';
dotenv.config();
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
}
catch (e) { }
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance-manager';
async function run() {
    await mongoose.connect(mongoUri, { family: 4 });
    const u = await User.findOne({ email: 'admin@attendance.com' }).lean();
    console.log('admin user:', u ? { email: u.email, role: u.role, name: u.name } : 'NOT FOUND');
    await mongoose.disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
