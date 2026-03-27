import mongoose from 'mongoose';
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://miqueiascirino_db_user:valemilk123456789@dbvale.chv7pdf.mongodb.net/attendance-manager';
async function main() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    const db = mongoose.connection.db;
    const usersCol = db.collection('users');
    const justCol = db.collection('justifications');
    // Get known supervisor IDs
    const supervisors = await usersCol.find({ role: 'supervisor' }, { projection: { supervisorId: 1 } }).toArray();
    const knownSupervisorIds = supervisors
        .map((u) => String(u.supervisorId || '').trim())
        .filter(Boolean);
    console.log('Known supervisor IDs:', knownSupervisorIds);
    // Same inference logic as backend
    function inferSupervisorIdFromEmployeeId(employeeId) {
        if (!employeeId)
            return null;
        const sorted = [...knownSupervisorIds].sort((a, b) => b.length - a.length);
        for (const sid of sorted) {
            if (employeeId.startsWith(sid + '-') || employeeId === sid) {
                return sid;
            }
        }
        return null;
    }
    const allJustifications = await justCol.find({}).toArray();
    console.log(`Found ${allJustifications.length} justifications`);
    let fixed = 0;
    for (const j of allJustifications) {
        const correctSupervisorId = inferSupervisorIdFromEmployeeId(j.employeeId || '');
        if (correctSupervisorId && j.supervisorId !== correctSupervisorId) {
            console.log(`Fixing ${j.employeeId}: "${j.supervisorId}" -> "${correctSupervisorId}"`);
            await justCol.updateOne({ _id: j._id }, { $set: { supervisorId: correctSupervisorId } });
            fixed++;
        }
    }
    console.log(`Fixed ${fixed} justifications`);
    await mongoose.disconnect();
}
main().catch(console.error);
