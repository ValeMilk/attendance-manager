"use strict";
async function run() {
    const email = process.argv[2] || 'admin@attendance.com';
    const pwd = process.argv[3] || 'admin123';
    const day = process.argv[4] || '2026-01-26';
    const loginRes = await fetch('http://127.0.0.1:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pwd }),
    });
    if (!loginRes.ok) {
        console.error('Login failed', await loginRes.text());
        process.exit(1);
    }
    const loginBody = await loginRes.json();
    const token = loginBody.accessToken;
    console.log('Logged in as', loginBody.user.email, 'role:', loginBody.user.role);
    const attRes = await fetch('http://127.0.0.1:5001/api/attendance', {
        headers: { Authorization: `Bearer ${token}` },
    });
    console.log('/api/attendance status:', attRes.status);
    const body = await attRes.json().catch(() => null);
    if (!Array.isArray(body)) {
        console.log('Attendance response not array:', body);
        return;
    }
    console.log('Total records:', body.length);
    const filtered = body.filter((r) => r.day === day || (r.employeeId && r.employeeId.toLowerCase().includes('max')));
    console.log('Records for day or name containing "max":', filtered.length);
    if (filtered.length > 0)
        console.log(JSON.stringify(filtered.slice(0, 50), null, 2));
}
run().catch(e => { console.error(e); process.exit(1); });
