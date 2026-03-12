import dotenv from 'dotenv';
import dns from 'dns';
import mongoose from 'mongoose';
import { Employee } from '../src/models/Employee.js';
import { User } from '../src/models/User.js';
dotenv.config();
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
}
catch { }
async function run() {
    await mongoose.connect(process.env.MONGODB_URI || '');
    const employeeHits = await Employee.find({
        $or: [
            { name: /antonia/i },
            { name: /joselania/i },
            { name: /monica/i },
            { slug: /antonia/i },
            { slug: /joselania/i },
            { slug: /monica/i },
        ],
    }).lean();
    const supervisors = await User.find({ role: 'supervisor' })
        .select('name supervisorId employees')
        .lean();
    const userHits = supervisors
        .map((sup) => {
        const names = (sup.employees || [])
            .map((e) => String(e?.name || ''))
            .filter((name) => /antonia|joselania|monica/i.test(name));
        return {
            supervisor: sup.name,
            supervisorId: sup.supervisorId,
            names,
        };
    })
        .filter((row) => row.names.length > 0);
    console.log('Employee collection hits:', employeeHits.map((e) => ({
        supervisorId: e.supervisorId,
        slug: e.slug,
        name: e.name,
    })));
    console.log('User.employees hits:', userHits);
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
