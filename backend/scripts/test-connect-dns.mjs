import dns from 'dns';
import { MongoClient } from 'mongodb';

async function main(){
  try{
    dns.setServers(['8.8.8.8','1.1.1.1']);
    const uri = process.env.MONGODB_URI;
    if(!uri){ console.error('MONGODB_URI not set'); process.exit(2); }
    const masked = uri.replace(/(mongodb(?:\+srv)?:\/\/[^:\/]+:)([^@]+)(@)/, '$1****$3');
    console.log('Using URI (masked):', masked);
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 20000 });
    await client.connect();
    console.log('Connected. Ping:');
    const res = await client.db('admin').command({ ping: 1 });
    console.log(JSON.stringify(res, null, 2));
    await client.close();
    process.exit(0);
  }catch(e){
    console.error('CONNECT ERROR:');
    console.error(e);
    process.exit(1);
  }
}

main();
