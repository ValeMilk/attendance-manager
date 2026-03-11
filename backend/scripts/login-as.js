"use strict";
async function run() {
    const email = process.argv[2];
    const pwd = process.argv[3];
    if (!email || !pwd) {
        console.error('Usage: npx tsx scripts/login-as.ts <email> <password>');
        process.exit(1);
    }
    const res = await fetch('http://127.0.0.1:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pwd }),
    });
    const body = await res.json().catch(() => ({}));
    console.log(email, '=>', res.status, body.user?.role, '\n');
    if (body)
        console.log('Response user:', body.user);
}
run().catch(e => { console.error(e); process.exit(1); });
