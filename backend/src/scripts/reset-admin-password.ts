import dns from 'dns';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

async function main(){
  try{
    dns.setServers(['8.8.8.8','1.1.1.1']);
    console.log('🔧 DNS servers ajustados para: 8.8.8.8, 1.1.1.1');
    const uri = process.env.MONGODB_URI;
    if(!uri){ console.error('MONGODB_URI not set'); process.exit(2); }
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 60000 });
    console.log('Conectado ao MongoDB');
    const email = 'admin@attendance.com';
    const user = await User.findOne({ email });
    if(!user){
      console.error('Admin user not found:', email);
      await mongoose.disconnect();
      process.exit(1);
    }
    const hashed = await bcrypt.hash('admin123', 10);
    user.password = hashed;
    await user.save();
    console.log('✅ Senha do admin redefinida para: admin123');
    await mongoose.disconnect();
    process.exit(0);
  }catch(e){
    console.error('Erro:', e);
    process.exit(1);
  }
}

main();
