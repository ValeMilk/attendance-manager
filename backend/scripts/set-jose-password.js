import dotenv from 'dotenv';
import dns from 'dns';
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import { User } from '../src/models/User.js';
dotenv.config();
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
}
catch { }
async function run() {
    await mongoose.connect(process.env.MONGODB_URI || '');
    const user = await User.findOne({ email: 'jose-furtado@attendance.com' });
    if (!user) {
        console.log('USER_NOT_FOUND');
        await mongoose.disconnect();
        process.exit(2);
    }
    user.password = await bcryptjs.hash('josefurtado123', 10);
    user.isActive = true;
    await user.save();
    console.log('PASSWORD_UPDATED', user.email);
    await mongoose.disconnect();
}
run().catch(async (error) => {
    console.error(error);
    try {
        await mongoose.disconnect();
    }
    catch { }
    process.exit(1);
});
