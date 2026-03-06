import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import dns from 'dns';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import attendanceRoutes from './routes/attendance.js';
import supervisorsRoutes from './routes/supervisors.js';
import employeesRoutes from './routes/employees.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/supervisors', supervisorsRoutes);
app.use('/api/employees', employeesRoutes);

// new routes were added: attendance (save/fetch) and justifications

const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance-manager';

console.log('🔍 Debug Info:');
console.log('MongoDB URI carregada:', mongoUri ? '✅ Sim' : '❌ Não');
console.log('PORT:', port);
console.log('NODE_ENV:', process.env.NODE_ENV);

async function main() {
  try {
    // Forçar resolução DNS via servidores públicos (corrige `querySrv ECONNREFUSED`)
    try{
      dns.setServers(['8.8.8.8', '1.1.1.1']);
      console.log('🔧 DNS servers ajustados para: 8.8.8.8, 1.1.1.1');
    }catch(e){ console.warn('⚠️ Não foi possível setar DNS servers:', e); }
    // Connect to MongoDB com opções adicionais
    console.log('\n📡 Conectando ao MongoDB...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 60000, // 60 segundos
      socketTimeoutMS: 60000,
      connectTimeoutMS: 60000,
      family: 4, // IPv4
      retryWrites: true,
      maxPoolSize: 10,
      minPoolSize: 5,
    });
    console.log('✅ Conectado ao MongoDB com sucesso!');

    // Start server (bind explicitly to IPv4 loopback)
    app.listen(port, '127.0.0.1', () => {
      console.log(`✅ Backend listening on http://127.0.0.1:${port}`);
    });
  } catch (err) {
    console.error('❌ Erro ao conectar ao MongoDB:', err);
    console.warn('⚠️ O servidor continuará em execução, mas sem conexão com o banco de dados. Tentarei reconectar a cada 10s.');

    // Iniciar servidor mesmo sem DB e tentar reconectar periodicamente
    app.listen(port, '127.0.0.1', () => {
      console.log(`✅ Backend listening on http://127.0.0.1:${port} (sem conexão com MongoDB)`);
    });

    // Tentativa de reconexão periódica (a cada 10s)
    const retryIntervalMs = 10000;
    let reconnectTimer: NodeJS.Timer | null = setInterval(async () => {
      try {
        console.log('🔁 Tentando reconectar ao MongoDB...');
        await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 60000,
          socketTimeoutMS: 60000,
          connectTimeoutMS: 60000,
          family: 4,
          retryWrites: true,
          maxPoolSize: 10,
          minPoolSize: 5,
        });
        console.log('✅ Reconectado ao MongoDB com sucesso!');
        if (reconnectTimer) { clearInterval(reconnectTimer); reconnectTimer = null; }
      } catch (e) {
        console.warn('⚠️ Reconexão falhou:', e.message || e);
      }
    }, retryIntervalMs);
  }
}

main();
