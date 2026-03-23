const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const employeeSchema = new mongoose.Schema({
  name: String,
  role: String,
  supervisorUserId: mongoose.Schema.Types.ObjectId,
  department: String,
  joinDate: Date,
  isActive: Boolean,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String
});

const Employee = mongoose.model('Employee', employeeSchema, 'employees');
const User = mongoose.model('User', userSchema, 'users');

async function populateEmployees() {
  try {
    console.log('Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Conectado\n');

    // Ler CSV
    const csvPath = '/opt/attendance-manager/frontend/public/Pasta1.csv';
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').slice(1); // Skip header

    const supervisorMap = {};
    const supervisors = await User.find({ role: 'supervisor' });
    supervisors.forEach(s => {
      supervisorMap[s.name.toUpperCase()] = s._id;
    });

    console.log(`Supervisores mapeados: ${Object.keys(supervisorMap).length}\n`);

    // Deletar funcionários existentes
    const deleteResult = await Employee.deleteMany({});
    console.log(`✓ Deletados ${deleteResult.deletedCount} funcionários antigos\n`);

    let count = 0;
    for (const line of lines) {
      if (!line.trim()) continue;

      const parts = line.split(';');
      if (parts.length < 2) continue;

      const supervisorName = parts[0].trim().toUpperCase();
      const employeeName = parts[1].trim();
      const role = parts[2]?.trim() || 'FUNCIONÁRIO';

      const supervisorId = supervisorMap[supervisorName];
      if (!supervisorId) {
        console.log(`⚠ Supervisor não encontrado: ${supervisorName}`);
        continue;
      }

      const employee = new Employee({
        name: employeeName,
        role: role,
        supervisorUserId: supervisorId,
        isActive: true,
        department: supervisorName
      });

      await employee.save();
      count++;
    }

    console.log(`\n✓ ${count} funcionários criados com sucesso!`);

    // Verificar totais
    const total = await Employee.countDocuments();
    console.log(`✓ Total de funcionários no banco: ${total}`);

    // Listar primeiros 5
    console.log('\n=== PRIMEIROS 5 FUNCIONÁRIOS ===');
    const first5 = await Employee.find().limit(5);
    first5.forEach(e => {
      console.log(`${e.name} | ${e.role} | ${e.department}`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error('ERRO:', err.message);
    process.exit(1);
  }
}

populateEmployees();
