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
    const rodney = await User.findOne({ name: 'RODNEY DE MACEDO' });
    if (!rodney) {
        console.error('RODNEY DE MACEDO não encontrado.');
        await mongoose.disconnect();
        process.exit(1);
    }
    // Determine the supervisorId value to assign (prefer existing rodney.supervisorId string)
    const rodneySupervisorId = rodney.supervisorId || rodney._id.toString();
    const supervisors = await User.find({ role: 'supervisor', _id: { $ne: rodney._id } });
    if (supervisors.length === 0) {
        console.log('Nenhum supervisor encontrado para associar.');
        await mongoose.disconnect();
        return;
    }
    let updatedCount = 0;
    for (const s of supervisors) {
        const prev = s.supervisorId;
        if (prev !== rodneySupervisorId) {
            s.supervisorId = rodneySupervisorId;
            await s.save();
            updatedCount++;
        }
        // add to rodney.employees using $addToSet to avoid duplicates
    }
    // Push supervisors into rodney.employees as objects { name, role }
    const toAdd = supervisors.map(s => ({ name: s.name, role: 'supervisor' }));
    // use update to add unique entries
    await User.updateOne({ _id: rodney._id }, { $addToSet: { employees: { $each: toAdd } } });
    const refreshedRodney = await User.findById(rodney._id).lean();
    console.log(`Associados ${updatedCount} supervisores ao Rodney.`);
    console.log(`Rodney agora tem ${refreshedRodney?.employees?.length || 0} employees.`);
    await mongoose.disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
