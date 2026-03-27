const m = require('mongoose');
m.connect(process.env.MONGODB_URI).then(async () => {
  const j = m.connection.collection('justifications');
  const docs = await j.find({}).limit(10).toArray();
  docs.forEach(d => console.log(JSON.stringify({ eid: d.employeeId, sid: d.supervisorId, day: d.day })));
  const u = m.connection.collection('users');
  const sups = await u.find({ role: 'supervisor' }).toArray();
  sups.forEach(s => console.log('USR:', JSON.stringify({ name: s.name, sid: s.supervisorId })));
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
