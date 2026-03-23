import mongoose from 'mongoose';
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const r = await mongoose.connection.db.collection('users').updateOne(
    { username: 'rodney' },
    { $set: { role: 'gerente' } }
  );
  console.log('Result:', JSON.stringify(r));
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
