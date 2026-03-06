# 🚀 Setup - APP FALTAS

## Pré-requisitos

- **Node.js** 18+ e **npm**
- **MongoDB Atlas** conta (https://cloud.mongodb.com)
- **Bun** (opcional, para gerenciar monorepo)

## 1️⃣ Configurar MongoDB Atlas

1. Acesse https://cloud.mongodb.com
2. Crie um cluster (ou use existente)
3. Copie a **connection string**:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/attendance-manager?retryWrites=true&w=majority
   ```
4. **Substitua** `username` e `password` com suas credenciais

## 2️⃣ Setup Backend

```bash
# Entrar na pasta backend
cd backend

# Instalar dependências
npm install

# Criar arquivo .env
cp .env.example .env

# Editar .env e colar sua MONGODB_URI
# (Abrir arquivo .env no editor e colar connection string do MongoDB)
```

### 3️⃣ Executar Seed (Popular com dados do CSV)

```bash
cd backend
npm run seed
```

**Saída esperada:**
```
Connected to MongoDB
✓ Admin created: admin@attendance.com / admin123
✓ "MARIANA MOURA" (15 employees)
✓ "JOSE FURTADO" (10 employees)
✓ "PAULO OLIVEIRA" (8 employees)
✓ "PAULINHO DE PAULA" (7 employees)
✓ Seed completed successfully!
```

## 4️⃣ Setup Frontend

```bash
# (Em outro terminal)
cd frontend

# Instalar dependências
npm install
```

## 5️⃣ Rodar Aplicação

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Backend rodando em http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend rodando em http://localhost:8080
```

## 6️⃣ Acessar Aplicação

Abra **http://localhost:8080** no navegador

### Credenciais Demo

| Tipo | Email | Senha |
|------|-------|-------|
| **Admin** | `admin@attendance.com` | `admin123` |
| **Supervisor** | `mariana-moura@attendance.com` | `supervisor123` |
| **Supervisor** | `jose-furtado@attendance.com` | `supervisor123` |

## 🎯 Funcionalidades

- ✅ **Login isolado** - Página de autenticação separada
- ✅ **RBAC** - Admin, Supervisor, Expectador com permissões diferentes
- ✅ **Apontamento** - Registrar presença/ausência por supervisor
- ✅ **Justificativas** - Adicionar motivos para faltas
- ✅ **Exportação** - Exportar dados em CSV/Excel (filtro por supervisor)
- ✅ **Período** - Visualizar e navegar entre períodos (26→25)
- ✅ **JWT Auth** - Token-based authentication

## 📊 Estrutura de Dados

**CSV** (`frontend/public/Pasta1.csv`):
```
SUPERVISOR;FUNCIONÁRIOS;FUNÇÃO
MARIANA MOURA;MAX FELIX MONTEIRO;PROMOTOR (A)
...
```

**Seed** cria:
1. **Admin** (admin@attendance.com)
2. **Supervisores** (um por supervisor do CSV com seus funcionários)
3. Dados de apontamento vazios (prontos para preenchimento)

## 🔧 Troubleshooting

### "Connection refused" - Backend

- Verificar se backend está rodando: `npm run dev` em `backend/`
- Verificar porta 5000: `netstat -ano | findstr :5000` (Windows)

### "MongoDB connection failed"

- Verificar MONGODB_URI em `.env`
- Verificar IP allowlist no MongoDB Atlas (adicionar `0.0.0.0/0` para local dev)
- Verificar credenciais username/password

### "CSV file not found"

- Verificar que `Pasta1.csv` existe em `frontend/public/`
- Executar seed novamente: `npm run seed` em `backend/`

### Frontend não conecta ao backend

- Verificar CORS em `backend/src/index.ts` (deve ter `app.use(cors())`)
- Backend em `http://localhost:5000`, Frontend em `http://localhost:8080`

## 📝 Próximos Passos

1. ✅ Rodar seed com CSV
2. ✅ Testar login (admin e supervisor)
3. ✅ Preencher apontamentos
4. ✅ Exportar dados
5. 📦 Deploy em produção

---

**Desenvolvido com ❤️ para APP FALTAS**
