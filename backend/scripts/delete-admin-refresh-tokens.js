import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models/User';
import { RefreshToken } from '../src/models/RefreshToken';
dotenv.config();
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
}
catch (e) { }
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance-manager';
async function run() {
    await mongoose.connect(mongoUri, { family: 4 });
    const admin = await User.findOne({ email: 'admin@attendance.com' });
    if (!admin) {
        console.log('Admin user not found');
        await mongoose.disconnect();
        return;
    }
    const res = await RefreshToken.deleteMany({ userId: admin._id });
    console.log(`Deleted refresh tokens for admin: ${res.deletedCount}`);
    await mongoose.disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
