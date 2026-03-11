"use strict";
async function run() {
    const email = process.argv[2];
    const pwd = process.argv[3];
    if (!email || !pwd) {
        console.error('Usage: npx tsx scripts/check-view.ts <email> <password>');
        process.exit(1);
    }
    const loginRes = await fetch('http://127.0.0.1:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pwd }),
    });
    const loginBody = await loginRes.json();
    const token = loginBody.accessToken;
    console.log('Logged in as', loginBody.user.email, 'role:', loginBody.user.role);
    const supRes = await fetch('http://127.0.0.1:5001/api/supervisors', {
        headers: { Authorization: `Bearer ${token}` },
    });
    console.log('/api/supervisors status:', supRes.status);
    const supBody = await supRes.json().catch(() => null);
    console.log('Supervisors returned:', Array.isArray(supBody) ? supBody.length : typeof supBody);
    if (Array.isArray(supBody))
        console.log('First item:', supBody[0]);
}
run().catch(e => { console.error(e); process.exit(1); });
