"use strict";
async function run() {
    const res = await fetch('http://127.0.0.1:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'mariana@attendance.com', password: 'mariana123' }),
    });
    console.log('Status:', res.status);
    const body = await res.text();
    console.log('Body:', body);
}
run().catch(e => { console.error(e); process.exit(1); });
