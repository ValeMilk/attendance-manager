import dotenv from 'dotenv';
import dns from 'dns';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
dotenv.config();
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
}
catch { }
const normalize = (s) => String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
async function run() {
    await mongoose.connect(process.env.MONGODB_URI || '');
    const users = await User.find({ role: { $in: ['supervisor', 'admin', 'expectador'] } })
        .select('name email role supervisorId isActive employees')
        .lean();
    const view = users.map((u) => ({
        _id: String(u._id),
        role: u.role,
        name: u.name,
        nameNorm: normalize(u.name),
        email: u.email,
        supervisorId: u.supervisorId,
        isActive: u.isActive,
        employeesCount: Array.isArray(u.employees) ? u.employees.length : 0,
    }));
    console.table(view);
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
