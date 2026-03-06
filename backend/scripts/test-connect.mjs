import { MongoClient } from 'mongodb';

function maskUri(uri){
  try{
    return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:\/]+:)([^@]+)(@)/, '$1****$3');
  }catch(e){ return uri.substring(0,80)+'...'; }
}

(async()=>{
  try{
    const uri = process.env.MONGODB_URI;
    if(!uri){ console.error('MONGODB_URI not set'); process.exit(2); }
    console.log('Using URI (masked):', maskUri(uri));
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 20000 });
    await client.connect();
    console.log('Connected. Ping:');
    const res = await client.db('admin').command({ ping: 1 });
    console.log(JSON.stringify(res, null, 2));
    await client.close();
    process.exit(0);
  } catch (e) {
    console.error('CONNECT ERROR:');
    console.error(e);
    process.exit(1);
  }
})();
