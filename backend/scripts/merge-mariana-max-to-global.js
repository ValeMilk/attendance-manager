import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Employee } from '../src/models/Employee';
import { AttendanceRecord } from '../src/models/AttendanceRecord';
dotenv.config();
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
}
catch (e) { }
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance-manager';
async function run() {
    await mongoose.connect(mongoUri, { family: 4 });
    console.log('Connected for merge-mariana-max-to-global');
    const candidates = await Employee.find({ supervisorId: 'mariana', slug: /max/i }).lean();
    console.log('Found mariana max candidates:', candidates.length);
    if (candidates.length === 0) {
        console.log('No candidates found, exiting.');
        await mongoose.disconnect();
        return;
    }
    // Ensure global-max exists
    await Employee.findOneAndUpdate({ supervisorId: 'global', slug: 'max' }, { $set: { name: 'Max', displayName: 'Max' } }, { upsert: true });
    let changed = 0;
    for (const c of candidates) {
        const candidateId = `${c.supervisorId}-${c.slug}`;
        const recs = await AttendanceRecord.find({ employeeId: candidateId }).lean();
        for (const r of recs) {
            const canon = await AttendanceRecord.findOne({ employeeId: 'global-max', day: r.day }).lean();
            if (canon) {
                // merge: prefer newer
                const rUpdated = r.updatedAt ? new Date(r.updatedAt).getTime() : 0;
                const cUpdated = canon.updatedAt ? new Date(canon.updatedAt).getTime() : 0;
                if (rUpdated > cUpdated) {
                    await AttendanceRecord.updateOne({ _id: canon._id }, { $set: { apontador: r.apontador, supervisor: r.supervisor, employeeName: 'Max', supervisorId: 'global' } });
                }
                await AttendanceRecord.deleteOne({ _id: r._id });
                console.log('Merged and deleted duplicate attendance', r._id.toString());
            }
            else {
                await AttendanceRecord.updateOne({ _id: r._id }, { $set: { employeeId: 'global-max', employeeName: 'Max', supervisorId: 'global' } });
                console.log('Updated attendance', r._id.toString(), '-> global-max');
            }
            changed++;
        }
        // delete Employee doc
        await Employee.deleteOne({ _id: c._id });
        console.log('Deleted employee doc', c._id.toString());
    }
    console.log('Done. Records changed:', changed);
    await mongoose.disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
