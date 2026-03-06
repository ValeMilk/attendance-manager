# 🗺️ Mapa Mental - APP FALTAS

## 🌍 Visão Geral do Sistema

```
APP FALTAS
│
├─ 🔐 AUTENTICAÇÃO
│  ├─ Login Isolado (LoginPage.tsx)
│  ├─ JWT Token (15min access + 7d refresh)
│  ├─ LocalStorage (persistência)
│  └─ RBAC (Admin, Supervisor, Expectador)
│
├─ 👥 USUÁRIOS
│  ├─ Admin
│  │  ├─ Vê todos
│  │  ├─ Edita tudo
│  │  └─ Exporta tudo
│  │
│  ├─ Supervisor
│  │  ├─ Vê seus funcionários (do CSV)
│  │  ├─ Edita apontamentos
│  │  └─ Exporta sua equipe
│  │
│  └─ Expectador
│     ├─ Vê dados
│     ├─ Sem edição
│     └─ Sem exportação
│
├─ 📊 DADOS
│  ├─ CSV Source (Pasta1.csv)
│  │  ├─ MARIANA MOURA (15 funcs)
│  │  ├─ JOSE FURTADO (10 funcs)
│  │  ├─ PAULO OLIVEIRA (8 funcs)
│  │  └─ PAULINHO DE PAULA (7 funcs)
│  │
│  ├─ Apontamentos
│  │  ├─ P (Presente)
│  │  ├─ F (Falta)
│  │  ├─ J (Justificada)
│  │  ├─ FE (Férias)
│  │  ├─ LIC (Licença)
│  │  ├─ AFH (Afastamento)
│  │  └─ FERI (Férias)
│  │
│  ├─ Justificativas
│  │  ├─ Texto do motivo
│  │  ├─ Data
│  │  └─ Criado por
│  │
│  └─ Períodos
│     ├─ 26 dias (passado)
│     └─ 25 dias (atual)
│
├─ 💻 FRONTEND (React)
│  ├─ Pages
│  │  ├─ LoginPage.tsx (login isolado)
│  │  └─ Index.tsx (planilha principal)
│  │
│  ├─ Components
│  │  ├─ AttendanceTable (grid principal)
│  │  ├─ AttendanceCell (célula editável)
│  │  ├─ DataExport (exportar CSV)
│  │  ├─ JustificationsSection (justificativas)
│  │  └─ HeaderControls (filtros)
│  │
│  ├─ Context
│  │  └─ AuthContext (estado login global)
│  │
│  ├─ Hooks
│  │  └─ useAttendance (estado planilha)
│  │
│  └─ Router
│     ├─ /login (LoginPage)
│     ├─ / (Index - protegido)
│     └─ * (NotFound)
│
├─ 🖥️ BACKEND (Express)
│  ├─ Routes
│  │  ├─ /api/auth
│  │  │  ├─ POST /login
│  │  │  ├─ POST /logout
│  │  │  ├─ POST /refresh
│  │  │  ├─ POST /register
│  │  │  └─ GET /profile
│  │  │
│  │  ├─ /api/users
│  │  │  └─ GET / (admin only)
│  │  │
│  │  └─ /api/attendance
│  │     ├─ GET /records
│  │     ├─ POST /records
│  │     ├─ DELETE /records/:id
│  │     └─ POST /justifications
│  │
│  ├─ Models (Mongoose)
│  │  ├─ User
│  │  │  ├─ name
│  │  │  ├─ email
│  │  │  ├─ password (hashed)
│  │  │  ├─ role
│  │  │  ├─ supervisorId
│  │  │  ├─ employees[] (para supervisores)
│  │  │  └─ isActive
│  │  │
│  │  ├─ RefreshToken
│  │  │  ├─ userId
│  │  │  ├─ token (hashed)
│  │  │  └─ expiresAt
│  │  │
│  │  └─ AttendanceRecord
│  │     ├─ employeeId
│  │     ├─ supervisorId
│  │     ├─ day (ISO date)
│  │     ├─ apontador
│  │     ├─ supervisor
│  │     └─ justifications[]
│  │
│  ├─ Middleware
│  │  └─ authenticateJWT (verifica token)
│  │
│  ├─ Scripts
│  │  └─ seed.ts (popula CSV)
│  │     ├─ parseCSV() → parse arquivo
│  │     ├─ groupBySupervisor() → agrupa dados
│  │     └─ seed() → cria users MongoDB
│  │
│  └─ Database
│     └─ MongoDB Atlas (Cloud)
│        ├─ Users collection
│        ├─ RefreshTokens collection
│        └─ AttendanceRecords collection
│
└─ 🚀 DEPLOYMENT
   ├─ Frontend
   │  ├─ Vite dev: npm run dev (8080)
   │  └─ Build: npm run build
   │
   ├─ Backend
   │  ├─ Dev: npm run dev (5000)
   │  ├─ Build: npm run build
   │  └─ Start: npm start
   │
   └─ Database
      └─ MongoDB Atlas (https://cloud.mongodb.com)
```

---

## 🔄 Fluxo de Interação

```
USUÁRIO
   │
   ├─1. Abre navegador → http://localhost:8080
   │   │
   │   └─2. LoginPage.tsx carrega
   │       ├─ Se tem token → vai para planilha
   │       └─ Se não tem → mostra formulário
   │
   ├─3. Digita email/senha
   │   │
   │   └─4. onClick em "Entrar"
   │       ├─ Chama useAuth().login()
   │       ├─ POST /api/auth/login
   │       └─ Backend valida (bcryptjs)
   │
   ├─5. Se OK → recebe JWT
   │   │
   │   └─6. AuthContext salva token
   │       ├─ localStorage.setItem('accessToken')
   │       ├─ setState user
   │       └─ Redireciona para /
   │
   ├─7. Index.tsx (planilha) carrega
   │   │
   │   └─8. ProtectedRoute valida token
   │       ├─ Se válido → mostra planilha
   │       └─ Se não → redireciona /login
   │
   ├─9. Usuário vê funcionários
   │   ├─ Admin → vê todos
   │   └─ Supervisor → vê só seus (filtrado)
   │
   ├─10. Clica em célula
   │    ├─ Se supervisor/admin → edita
   │    └─ Se expectador → desabilitado
   │
   ├─11. Digita código (P, F, J, etc)
   │    └─ POST /api/attendance/records
   │       └─ Backend salva em MongoDB
   │
   ├─12. Clica "Justificar"
   │    ├─ JustificationsSection abre
   │    └─ Texto → POST /api/attendance/justifications
   │
   ├─13. Clica "Exportar"
   │    ├─ DataExport.tsx prepara dados
   │    └─ Gera CSV/Excel (apenas se supervisor vê só seus)
   │
   └─14. Faz logout
       └─ useAuth().logout()
          ├─ DELETE /api/auth/logout
          ├─ localStorage.clear()
          └─ Redireciona /login
```

---

## 📦 Arquivo Importante

```
frontend/public/Pasta1.csv
│
├─ Linha 1: Header
│  └─ SUPERVISOR;FUNCIONÁRIOS;FUNÇÃO
│
├─ Linhas 2-44: Dados
│  ├─ MARIANA MOURA;MAX FELIX MONTEIRO;PROMOTOR (A)
│  ├─ MARIANA MOURA;FRANCISCA NALDIANA;DEGUSTADORA (A)
│  ├─ JOSE FURTADO;...
│  ├─ PAULO OLIVEIRA;...
│  └─ PAULINHO DE PAULA;...
│
└─ Seed.ts lê este arquivo
   ├─ parseCSV() extrai dados
   ├─ groupBySupervisor() organiza
   └─ Cria users no MongoDB com employees array
```

---

## 🔐 Segurança

```
Password Flow:
1. Usuário digita senha (frontend)
2. Envia para /api/auth/login (HTTPS em prod)
3. Backend recebe (não armazena em log)
4. bcryptjs.compare() com hash armazenado
5. Se OK → gera JWT (não contem senha)
6. Frontend armazena JWT em localStorage
7. Requests subsequentes usam JWT header
8. Backend verifica JWT antes de processar

Token Flow:
1. Access Token (15 min) - curto prazo
   └─ Usado em cada request: Authorization: Bearer <token>
2. Refresh Token (7 dias) - longo prazo
   └─ Usado para renovar access token quando expira
3. Token renovação automática
   └─ Frontend tenta refresh se access expirar
```

---

## 🎯 Casos de Teste

```
✅ Teste 1: Login com admin
   → Entrada: admin@attendance.com / admin123
   → Esperado: Vê todos supervisores e funcionários

✅ Teste 2: Login com supervisor
   → Entrada: mariana-moura@attendance.com / supervisor123
   → Esperado: Vê apenas seus 15 funcionários

✅ Teste 3: Preencher apontamento
   → Entrada: Clica célula + digita "P"
   → Esperado: Salva e mostra "P"

✅ Teste 4: Adicionar justificativa
   → Entrada: Clica "Justificar" + digita motivo
   → Esperado: Motivo aparece abaixo da célula

✅ Teste 5: Exportar dados
   → Entrada: Admin clica "Exportar"
   → Esperado: Baixa arquivo CSV com todos

✅ Teste 6: Logout
   → Entrada: Clica logout
   → Esperado: Volta para /login
```

---

## 🛠️ Ferramentas & Versões

```
Runtime:
├─ Node.js 18+
├─ npm 9+
└─ (Opcional) Bun

Frontend:
├─ React 18.2
├─ TypeScript 5.3
├─ Vite 5.0
├─ Tailwind CSS 3.4
└─ Shadcn UI (Latest)

Backend:
├─ Express 4.18
├─ Mongoose 8.0
├─ TypeScript 5.3
├─ bcryptjs 2.4
├─ jsonwebtoken 9.1
└─ CORS 2.8

Database:
└─ MongoDB 6+ (Atlas Cloud)

Build:
├─ tsc (TypeScript compiler)
├─ tsx (TS executor)
└─ Vite bundler
```

---

## 📚 Arquivos de Documentação

```
Raiz do Projeto
│
├─ SUMMARY.md       ← Resumo executivo (START HERE)
├─ QUICK_START.md   ← 5 minutos para rodar
├─ SETUP.md         ← Guia completo + troubleshooting
├─ CHECKLIST.md     ← Status de cada feature
├─ OVERVIEW.md      ← Visão técnica com diagramas
└─ MAPAMENTAL.md    ← Este arquivo (mapa visual)
```

---

## 🚀 Checklist de Inicialização

```
[ ] Fazer setup backend (npm install + .env)
[ ] Fazer setup frontend (npm install)
[ ] Rodar seed (npm run seed)
[ ] Iniciar backend (npm run dev - porta 5000)
[ ] Iniciar frontend (npm run dev - porta 8080)
[ ] Acessar http://localhost:8080
[ ] Login com admin@attendance.com
[ ] Verificar planilha carregou com dados
[ ] Testar edição de célula
[ ] Testar adição de justificativa
[ ] Testar exportação
[ ] Logout e relogin com supervisor
[ ] Verificar filtro de supervisor
[ ] Comemorar! 🎉
```

---

## 💡 Dicas Úteis

```
Debug Frontend:
├─ F12 → Console (erros de JS)
├─ F12 → Network (chamadas API)
├─ F12 → Application (localStorage/tokens)
└─ Verifica se backend está online

Debug Backend:
├─ Terminal mostra logs
├─ Verificar .env MONGODB_URI
├─ `npm run seed` para popular dados
└─ Testar rotas com Postman/Insomnia

MongoDB:
├─ Acessar https://cloud.mongodb.com
├─ Verificar collections em Database → Collections
├─ Usar MongoDB Atlas UI para visualizar dados
└─ Verificar IP whitelist (adicionar 0.0.0.0/0 para local)
```

---

**Mapa Mental do APP FALTAS - Visão 360°**
**Última atualização: 2024**
