import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}

const base = process.env.API_BASE || 'http://127.0.0.1:5001';

async function login(email: string, password: string) {
  const res = await fetch(`${base}/api/auth/login`, { method: 'POST', body: JSON.stringify({ email, password }), headers: { 'content-type': 'application/json' } });
  return res.json();
}

async function getEmployees(token: string) {
  const res = await fetch(`${base}/api/employees`, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
}

async function getAttendance(token: string) {
  const res = await fetch(`${base}/api/attendance`, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
}

async function run() {
  console.log('Login mariana...');
  const mar = await login('mariana@attendance.com', 'mariana123');
  const marToken = mar.accessToken;
  console.log('Employees (mariana):');
  console.dir(await getEmployees(marToken), { depth: 4 });
  console.log('Attendance (mariana):');
  console.dir(await getAttendance(marToken), { depth: 4 });

  console.log('\nLogin admin...');
  const admin = await login('admin@attendance.com', 'admin123');
  const aToken = admin.accessToken;
  console.log('Employees (admin):');
  console.dir(await getEmployees(aToken), { depth: 4 });
  console.log('Attendance (admin):');
  console.dir(await getAttendance(aToken), { depth: 4 });
}

run().catch(e => { console.error(e); process.exit(1); });
