# 📱 APP FALTAS - Sistema de Apontamento de Presença

> Sistema web completo para apontamento de faltas com controle de acesso por papel (Admin, Supervisor, Expectador)

## 🎯 Objetivo

Gerenciar apontamentos de presença/ausência de funcionários organizados por supervisores, permitindo:
- ✅ Autenticação segura com JWT
- ✅ Controle de acesso por papel (RBAC)
- ✅ Integração com dados do CSV
- ✅ Preenchimento de apontamentos em planilha
- ✅ Justificativa de faltas
- ✅ Exportação de relatórios

---

## 🚀 Começar Rápido

### Pré-requisitos
- Node.js 18+ e npm
- MongoDB Atlas account (https://cloud.mongodb.com)

### Setup (5 minutos)

```bash
# 1. Instalar dependências
cd backend && npm install
cd ../frontend && npm install

# 2. Configurar .env (editar backend/.env com sua MONGODB_URI)
# 3. Popular dados do CSV
cd backend && npm run seed

# 4. Abrir 2 terminais
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
cd frontend && npm run dev

# 5. Acessar
# http://localhost:8080
```

**Credenciais demo:**
```
Admin: admin@attendance.com / admin123
Supervisor: mariana-moura@attendance.com / supervisor123
```

---

## 📖 Documentação

| Documento | Descrição | Tempo |
|-----------|-----------|-------|
| [START_HERE.md](START_HERE.md) | 👈 **COMECE AQUI** | 2 min |
| [QUICK_START.md](QUICK_START.md) | Setup rápido | ⚡ 5 min |
| [SETUP.md](SETUP.md) | Guia completo + troubleshooting | 📖 20 min |
| [GUIA_PASSO_A_PASSO.md](GUIA_PASSO_A_PASSO.md) | Passo-a-passo detalhado | 📋 10 min |
| [CHECKLIST.md](CHECKLIST.md) | Status de cada feature | ✅ 5 min |
| [OVERVIEW.md](OVERVIEW.md) | Visão técnica + diagramas | 🏗️ 15 min |
| [MAPAMENTAL.md](MAPAMENTAL.md) | Mapa mental visual | 🗺️ 10 min |
| [SUMMARY.md](SUMMARY.md) | Resumo executivo | 📊 5 min |

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────┐
│  Frontend (React 18 + TypeScript + Vite)            │
│  - LoginPage isolada                                │
│  - AttendanceTable com edição inline                │
│  - DataExport com filtros                           │
│  - JustificationsSection                            │
│  Port: 8080                                         │
└────────────┬────────────────────────────────────────┘
             │ API JSON (Fetch)
┌────────────▼────────────────────────────────────────┐
│  Backend (Node.js + Express + TypeScript)           │
│  - POST /api/auth/login                             │
│  - GET /api/attendance/records                      │
│  - POST /api/attendance/justifications              │
│  - Middleware: JWT + RBAC                           │
│  Port: 5000                                         │
└────────────┬────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────┐
│  Database (MongoDB Atlas - Cloud)                   │
│  - Users (admin, supervisores)                      │
│  - RefreshTokens                                    │
│  - AttendanceRecords                                │
└──────────────────────────────────────────────────────┘
```

---

## 📊 Dados Suportados

**CSV (4 supervisores + 40+ funcionários):**
```
SUPERVISOR;FUNCIONÁRIOS;FUNÇÃO
MARIANA MOURA;MAX FELIX MONTEIRO;PROMOTOR (A)
JOSE FURTADO;...;...
PAULO OLIVEIRA;...;...
PAULINHO DE PAULA;...;...
```

**Códigos de apontamento:**
- `P` = Presente
- `F` = Falta
- `J` = Justificada
- `FE` = Férias
- `LIC` = Licença
- `AFH` = Afastamento por Acidente
- `FERI` = Férias

---

## 🔐 Permissões por Papel

| Feature | Admin | Supervisor | Expectador |
|---------|-------|-----------|-----------|
| Ver todos | ✅ | ❌ (só seus) | ✅ (só seus) |
| Editar | ✅ | ✅ | ❌ |
| Justificar | ✅ | ✅ | ❌ |
| Exportar | ✅ | ✅ | ❌ |
| Gerenciar | ✅ | ❌ | ❌ |

---

## 🛠️ Stack Técnico

### Frontend
- React 18.2 + TypeScript 5.3
- Vite 5.0 (bundler rápido)
- Tailwind CSS 3.4 (styling)
- Shadcn UI (componentes)
- React Router v6 (navegação)
- TanStack Query (data fetching)

### Backend
- Node.js + Express 4.18
- TypeScript 5.3
- Mongoose 8.0 (MongoDB ODM)
- JWT (autenticação)
- bcryptjs (hashing)
- CORS (cross-origin)

### Database
- MongoDB 6+ (Atlas Cloud)
- Collections: Users, RefreshTokens, AttendanceRecords

---

## 📁 Estrutura do Projeto

```
attendance-manager/
├── backend/
│   ├── src/
│   │   ├── models/ (User, RefreshToken, AttendanceRecord)
│   │   ├── routes/ (auth, users, attendance)
│   │   ├── middleware/ (JWT authentication)
│   │   ├── scripts/ (seed.ts - popula CSV)
│   │   └── index.ts (servidor Express)
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/ (LoginPage, Index)
│   │   ├── components/ (AttendanceTable, DataExport, etc)
│   │   ├── context/ (AuthContext)
│   │   ├── hooks/ (useAttendance)
│   │   └── App.tsx (routing + ProtectedRoute)
│   ├── public/ (Pasta1.csv com dados)
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── README.md (este arquivo)
├── START_HERE.md (👈 comece aqui)
├── QUICK_START.md
├── SETUP.md
├── CHECKLIST.md
└── MAPAMENTAL.md
```

---

## 🚀 Rodar Aplicação

### Desenvolvimento

```bash
# Terminal 1 - Backend
cd backend
npm run dev
# http://localhost:5000

# Terminal 2 - Frontend
cd frontend
npm run dev
# http://localhost:8080
```

### Build para Produção

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm run preview
```

---

## 🧪 Testar Funcionalidades

1. **Login**
   - Acessar http://localhost:8080
   - Login com admin@attendance.com / admin123

2. **Visualizar planilha**
   - Admin vê todos supervisores
   - Supervisor vê apenas seus funcionários

3. **Editar apontamento**
   - Clicar célula e digitar código (P, F, J, etc)

4. **Adicionar justificativa**
   - Clicar "Justificar" e digitar motivo

5. **Exportar dados**
   - Clicar "Exportar" e escolher formato

---

## 📝 Variáveis de Ambiente

### Backend (.env)
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=sua_chave_secreta
JWT_REFRESH_SECRET=sua_chave_refresh
PORT=5000
NODE_ENV=development
```

---

## 🐛 Troubleshooting

**Backend não conecta MongoDB:**
→ Verificar `MONGODB_URI` em `.env` e IP whitelist em MongoDB Atlas

**Frontend não conecta backend:**
→ Verificar se backend está rodando em `http://localhost:5000`

**Seed não carrega CSV:**
→ Verificar se `Pasta1.csv` existe em `frontend/public/`

Mais detalhes em [SETUP.md](SETUP.md#troubleshooting)

---

## 📞 Próximos Passos

1. ✅ Clonar/baixar projeto
2. ✅ Seguir [QUICK_START.md](QUICK_START.md) (5 min)
3. ✅ Testar aplicação
4. 🚀 Deploy em produção

---

## 💡 Features Implementadas

- ✅ Login isolado com JWT
- ✅ RBAC (Admin/Supervisor/Expectador)
- ✅ Integração CSV para supervisores/funcionários
- ✅ Planilha inteligente com período 26→25
- ✅ Apontamentos (P, F, J, FE, LIC, AFH, FERI)
- ✅ Justificativa de faltas
- ✅ Exportação em CSV/Excel
- ✅ Filtro por supervisor
- ✅ UI responsiva com Tailwind + Shadcn
- ✅ Documentação completa

---

## 📄 Licença

MIT - Sinta-se livre para usar e modificar

---

## 👨‍💼 Desenvolvido com ❤️

**Status:** ✅ Completo e funcional  
**Versão:** 1.0.0  
**Última atualização:** 2024

---

## 🎯 Precisa de Ajuda?

1. Leia [START_HERE.md](START_HERE.md) para orientação
2. Consulte [SETUP.md](SETUP.md) para guia completo
3. Verifique [CHECKLIST.md](CHECKLIST.md) para status
4. Acesse documentação em português em [GUIA_PASSO_A_PASSO.md](GUIA_PASSO_A_PASSO.md)
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
