import dotenv from 'dotenv';
import dns from 'dns';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
dotenv.config();
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
}
catch { }
const LEGACY_EMAILS = [
    'rodney@attendance.com',
    'paulo@attendance.com',
    'paulinho@attendance.com',
    'mariana@attendance.com',
];
async function run() {
    await mongoose.connect(process.env.MONGODB_URI || '');
    const before = await User.find({ email: { $in: LEGACY_EMAILS } })
        .select('name email role supervisorId isActive')
        .lean();
    const result = await User.updateMany({ email: { $in: LEGACY_EMAILS }, role: 'supervisor' }, { $set: { isActive: false } });
    const after = await User.find({ email: { $in: LEGACY_EMAILS } })
        .select('name email role supervisorId isActive')
        .lean();
    console.log('Legacy accounts before:', before);
    console.log('Update result:', {
        matched: result.matchedCount,
        modified: result.modifiedCount,
    });
    console.log('Legacy accounts after:', after);
    await mongoose.disconnect();
}
run().catch(async (e) => {
    console.error(e);
    try {
        await mongoose.disconnect();
    }
    catch { }
    process.exit(1);
});
