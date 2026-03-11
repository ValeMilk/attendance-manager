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
const emails = [
    'admin@attendance.com',
    'mariana-moura@attendance.com',
    'paulo@attendance.com',
    'paulinho@attendance.com',
    'rodney-de-macedo@attendance.com',
    'expectador@attendance.com',
];
async function run() {
    await mongoose.connect(mongoUri, { family: 4 });
    console.log('Connected to MongoDB');
    for (const email of emails) {
        const user = await User.findOne({ email }).lean();
        if (!user) {
            console.log('User not found:', email);
            continue;
        }
        const res = await RefreshToken.deleteMany({ userId: user._id });
        console.log(`Deleted ${res.deletedCount || 0} refresh tokens for ${email}`);
    }
    // Also clear any orphaned refresh tokens older than 30 days as cleanup
    const cutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
    const old = await RefreshToken.deleteMany({ expiresAt: { $lt: cutoff } });
    console.log(`Deleted ${old.deletedCount || 0} expired/orphaned refresh tokens older than 30 days`);
    await mongoose.disconnect();
    console.log('Done');
}
run().catch(e => { console.error(e); process.exit(1); });
