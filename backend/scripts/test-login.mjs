(async()=>{
  try{
    const body = JSON.stringify({ email: 'admin@attendance.com', password: 'admin123' });
    const endpoints = [
      'http://127.0.0.1:5001/api/auth/login',
      'http://localhost:5001/api/auth/login',
      'http://127.0.0.1:8081/api/auth/login'
    ];
    // First test GET / on backend
    try{
      console.log('\n--- GET http://127.0.0.1:5001/ ---');
      const r0 = await fetch('http://127.0.0.1:5001/');
      console.log('GET / status', r0.status);
      console.log('GET / body', await r0.text());
    }catch(e){ console.error('GET / error', e && e.stack ? e.stack : e); }

    for(const url of endpoints){
      try{
        console.log('\n--- POST', url, '---');
        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body });
        console.log('Status:', res.status);
        const txt = await res.text();
        console.log('Body:', txt);
      }catch(e){
        console.error('Request error for', url, e && e.stack ? e.stack : e);
      }
    }
  }catch(e){
    console.error('Fatal', e);
    process.exit(1);
  }
})();
