import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Employee } from '../src/models/Employee';
dotenv.config();
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
}
catch (e) { }
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance-manager';
async function run() {
    await mongoose.connect(mongoUri, { family: 4 });
    const res = await Employee.findOneAndUpdate({ supervisorId: 'global', slug: 'max' }, { $set: { name: 'Max', displayName: 'Max' } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    console.log('Created/updated global-max:', res._id.toString());
    await mongoose.disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
