const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  supervisorId: mongoose.Schema.Types.ObjectId,
  employees: [mongoose.Schema.Types.ObjectId],
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
});

const User = mongoose.model('User', userSchema, 'users');

async function main() {
  try {
    console.log('Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Conectado');
    
    console.log('\n=== ATUALIZANDO SENHAS ===\n');
    
    const updates = [
      { email: 'paulinho-de-paula@attendance.com', password: 'paulinho123' },
      { email: 'mariana-moura@attendance.com', password: 'mariana123' },
      { email: 'jose-furtado@attendance.com', password: 'jose123' },
      { email: 'paulo-oliveira@attendance.com', password: 'paulo123' }
    ];
    
    for (const update of updates) {
      const hashedPassword = await bcrypt.hash(update.password, 10);
      const result = await User.findOneAndUpdate(
        { email: update.email },
        { password: hashedPassword },
        { new: true }
      );
      if (result) {
        console.log(`✓ ${result.name}: ${update.email} / ${update.password}`);
      }
    }
    
    console.log('\n=== RESULTADO ===\n');
    const allUsers = await User.find();
    allUsers.forEach(u => console.log(`${u.name} | ${u.email} | ${u.role}`));
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('ERRO:', err.message);
    process.exit(1);
  }
}

main();
