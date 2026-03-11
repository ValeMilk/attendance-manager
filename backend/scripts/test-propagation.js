import dotenv from 'dotenv';
import dns from 'dns';
dotenv.config();
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
}
catch (e) { }
const base = process.env.API_BASE || 'http://127.0.0.1:5001';
async function login(email, password) {
    const res = await fetch(`${base}/api/auth/login`, { method: 'POST', body: JSON.stringify({ email, password }), headers: { 'content-type': 'application/json' } });
    return res.json();
}
async function postAttendance(token, records) {
    const res = await fetch(`${base}/api/attendance`, { method: 'POST', body: JSON.stringify({ records }), headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` } });
    return res.json();
}
async function getAttendance(token) {
    const res = await fetch(`${base}/api/attendance`, { headers: { Authorization: `Bearer ${token}` } });
    return res.json();
}
async function run() {
    console.log('Logging in as admin...');
    const admin = await login('admin@attendance.com', 'admin123');
    const adminToken = admin.accessToken;
    console.log('Admin token OK');
    // Modify global-max for a test day
    const testDay = '2026-03-04';
    const records = [{ employeeId: 'global-max', day: testDay, apontador: 'F', supervisor: 'F' }];
    console.log('Posting attendance as admin for global-max');
    const p = await postAttendance(adminToken, records);
    console.log('Post result:', p);
    console.log('Logging in as mariana...');
    const mar = await login('mariana@attendance.com', 'mariana123');
    const marToken = mar.accessToken;
    console.log('Fetching attendance as mariana');
    const att = await getAttendance(marToken);
    console.log('Mariana attendance entries:', att.length);
    console.dir(att, { depth: 4 });
}
run().catch(e => { console.error(e); process.exit(1); });
