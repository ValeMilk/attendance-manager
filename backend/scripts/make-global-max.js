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
function slugify(s) {
    return String(s || '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-]/g, '')
        .replace(/-+/g, '-');
}
async function run() {
    await mongoose.connect(mongoUri, { family: 4 });
    console.log('Connected to MongoDB for make-global-max');
    // Find employees that look like "max"
    const candidates = await Employee.find({ $or: [{ slug: /max/i }, { name: /max/i }, { displayName: /max/i }] }).lean();
    console.log('Max candidates:', candidates.length);
    for (const c of candidates)
        console.log({ _id: c._id, supervisorId: c.supervisorId, slug: c.slug, name: c.name });
    if (candidates.length === 0) {
        console.log('No candidates found; creating global-max with name "Max"');
    }
    // Create or get global canonical
    const globalSlug = 'max';
    const globalName = 'Max';
    const canonical = await Employee.findOneAndUpdate({ supervisorId: 'global', slug: globalSlug }, { $set: { name: globalName, displayName: globalName } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    console.log('Canonical global employee:', canonical._id.toString());
    // For each candidate, migrate AttendanceRecord entries to canonical
    const migratedFrom = [];
    for (const c of candidates) {
        const candidateId = `${c.supervisorId}-${c.slug}`;
        const q = { $or: [{ employeeId: candidateId }, { employeeId: { $regex: new RegExp(c.slug, 'i') } }, { employeeName: { $regex: new RegExp(c.slug, 'i') } }] };
        const update = { $set: { employeeId: `global-${globalSlug}`, employeeName: globalName, supervisorId: 'global' } };
        const res = await AttendanceRecord.updateMany(q, update);
        console.log(`Migrated attendance from ${candidateId}:`, res.matchedCount || res.n || res.modifiedCount || 0);
        migratedFrom.push(candidateId);
        // remove the old employee doc
        await Employee.deleteOne({ _id: c._id });
        console.log('Deleted old employee doc', c._id);
    }
    console.log('Migration complete. Migrated from:', migratedFrom);
    await mongoose.disconnect();
}
run().catch(e => { console.error('make-global-max failed', e); process.exit(1); });
