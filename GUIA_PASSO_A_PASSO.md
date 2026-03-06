# 📖 Guia Passo-a-Passo - APP FALTAS

## Índice
1. [Preparação do Ambiente](#preparação)
2. [Configurar Backend](#backend)
3. [Configurar Frontend](#frontend)
4. [Popular Dados (CSV)](#seed)
5. [Rodar Aplicação](#rodar)
6. [Testar Funcionalidades](#testes)
7. [Troubleshooting](#troubleshooting)

---

## <a name="preparação"></a>1️⃣ Preparação do Ambiente

### Verificar Instalações Necessárias

**Windows (PowerShell):**
```powershell
# Verificar Node.js
node -v
npm -v

# Esperado: Node v18+ e npm 9+
# Se não tiver, baixar em: https://nodejs.org
```

**Verificar MongoDB Atlas**
1. Acessar https://cloud.mongodb.com
2. Login com sua conta (criar se não tiver)
3. Criar ou usar cluster existente
4. Copiar connection string

---

## <a name="backend"></a>2️⃣ Configurar Backend

### Passo 1: Entrar na pasta backend
```powershell
cd backend
```

### Passo 2: Instalar dependências
```powershell
npm install
```

**Saída esperada:**
```
added 152 packages in 45s
```

### Passo 3: Criar arquivo .env

**Copiar template:**
```powershell
copy .env.example .env
```

### Passo 4: Editar .env com MongoDB URI

**Abrir arquivo:**
```powershell
# Com seu editor favorito (VS Code, Notepad, etc)
notepad .env
```

**Arquivo deve ficar assim:**
```
MONGODB_URI=mongodb+srv://seu_usuario:sua_senha@cluster0.xxxxx.mongodb.net/attendance-manager?retryWrites=true&w=majority
JWT_SECRET=your_secret_key_here_change_in_production
JWT_REFRESH_SECRET=your_refresh_secret_key_here_change_in_production
PORT=5000
NODE_ENV=development
```

**Onde conseguir MONGODB_URI:**
1. Acesse https://cloud.mongodb.com
2. Clique em "Connect"
3. Escolha "Drivers"
4. Copie a string (substitua `<password>` e `<username>`)

### Passo 5: Testar conexão backend (opcional)
```powershell
npm run dev
```

**Esperado:**
```
Connected to MongoDB
Backend listening on http://localhost:5000
```

Tecle `CTRL+C` para parar.

---

## <a name="frontend"></a>3️⃣ Configurar Frontend

### Passo 1: Voltar à pasta raiz
```powershell
cd ..
```

### Passo 2: Entrar na pasta frontend
```powershell
cd frontend
```

### Passo 3: Instalar dependências
```powershell
npm install
```

**Saída esperada:**
```
added 298 packages in 2m
```

---

## <a name="seed"></a>4️⃣ Popular Dados (CSV - Seed)

### Passo 1: Voltar ao backend
```powershell
cd ../backend
```

### Passo 2: Executar seed
```powershell
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

### ⚠️ Se der erro "CSV file not found"
1. Verificar se arquivo existe: `frontend/public/Pasta1.csv`
2. Se não existir, criar arquivo com dados
3. Rodar seed novamente

### ⚠️ Se der erro "Connection failed"
1. Verificar MONGODB_URI em `.env`
2. Verificar credenciais do MongoDB
3. Verificar IP whitelist: adicionar `0.0.0.0/0` em MongoDB Atlas → Network Access

---

## <a name="rodar"></a>5️⃣ Rodar Aplicação

### Opção A: Em Terminais Separados (Recomendado)

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
```

**Esperado:**
```
Connected to MongoDB
Backend listening on http://localhost:5000
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

**Esperado:**
```
VITE v5.x.x  ready in 234 ms

➜  Local:   http://127.0.0.1:8080/
```

### Opção B: Script Automático

Se tiver criado `setup.ps1`:
```powershell
# Direto da raiz
.\setup.ps1
```

---

## <a name="testes"></a>6️⃣ Testar Funcionalidades

### Teste 1: Abrir Aplicação
1. Abrir navegador → http://localhost:8080
2. **Esperado:** LoginPage com form de login

### Teste 2: Login com Admin
1. Email: `admin@attendance.com`
2. Senha: `admin123`
3. Clicar "Entrar"
4. **Esperado:** Redireciona para planilha + vê todos supervisores

### Teste 3: Ver Planilha Admin
1. Vê tabela com todos funcionários
2. Vê dropdown "SUPERVISOR" com filtro
3. Vê botão "Exportar"
4. **Esperado:** Tudo funciona

### Teste 4: Editar Célula
1. Clicar em célula de apontamento
2. Digitar `P` (presente)
3. **Esperado:** Célula muda para "P"

### Teste 5: Adicionar Justificativa
1. Clicar célula com `F` (falta)
2. Clicar "Justificar"
3. Digitar motivo: "Doença"
4. Clicar "Confirmar"
5. **Esperado:** Motivo aparece abaixo

### Teste 6: Exportar Dados
1. Clicar "Exportar"
2. Escolher "Excel" ou "CSV"
3. **Esperado:** Arquivo baixa

### Teste 7: Logout
1. Clicar "Logout" (canto superior)
2. **Esperado:** Volta para LoginPage

### Teste 8: Login com Supervisor
1. Email: `mariana-moura@attendance.com`
2. Senha: `supervisor123`
3. **Esperado:** Vê apenas seus 15 funcionários

### Teste 9: Supervisor não consegue editar de outro
1. Como supervisor, tentar editar outro supervisor
2. **Esperado:** Não consegue (filtra automático)

### Teste 10: Teste Expectador (futuro)
1. Usuário com role `expectador`
2. **Esperado:** Vê planilha mas não consegue editar

---

## <a name="troubleshooting"></a>7️⃣ Troubleshooting

### Problema: "ECONNREFUSED" ou "Connection refused"

**Erro no Frontend:**
```
Failed to fetch
ERR_HTTP_RESPONSE_CODE_FAILURE
```

**Solução:**
```powershell
# 1. Verificar se backend está rodando
cd backend
npm run dev

# 2. Testar conexão
curl http://localhost:5000

# 3. Se não funcionar, verificar porta
netstat -ano | findstr :5000
```

---

### Problema: "Cannot find module 'mongoose'"

**Erro:**
```
Error: Cannot find module 'mongoose'
```

**Solução:**
```powershell
cd backend
npm install mongoose bcryptjs jsonwebtoken
```

---

### Problema: "CSV file not found"

**Erro no seed:**
```
⚠ CSV file not found at ...Pasta1.csv
```

**Solução:**
```powershell
# Verificar arquivo existe
dir frontend\public\Pasta1.csv

# Se não existir, copiar de outro lugar ou criar
# Formato esperado:
# SUPERVISOR;FUNCIONÁRIOS;FUNÇÃO
# MARIANA MOURA;MAX FELIX;PROMOTOR (A)
```

---

### Problema: "MONGODB_URI is not set"

**Erro:**
```
Error: MONGODB_URI is not set in environment variables
```

**Solução:**
```powershell
# 1. Verificar .env existe
cat backend\.env

# 2. Se não tiver MONGODB_URI, adicionar
# Editar backend/.env e preencher MONGODB_URI

# 3. Rodar seed novamente
cd backend
npm run seed
```

---

### Problema: "Access Denied" - MongoDB

**Erro:**
```
AuthenticationFailed: authentication failed
```

**Solução:**
1. Verificar username/password em MONGODB_URI
2. Verificar IP whitelist em MongoDB Atlas
   - Network Access → Add IP Address
   - Adicionar `0.0.0.0/0` para aceitar de qualquer lugar (dev apenas!)
3. Rodar seed novamente

---

### Problema: "CORS Error" ou "No 'Access-Control-Allow-Origin' header"

**Erro no console:**
```
Access to XMLHttpRequest at 'http://localhost:5000/...' from origin 
'http://localhost:8080' has been blocked by CORS policy
```

**Solução:**
```powershell
# 1. Verificar backend tem CORS ativado
# Abrir backend/src/index.ts
# Deve ter: app.use(cors());

# 2. Se não tiver, adicionar no topo das rotas

# 3. Reiniciar backend
cd backend
npm run dev
```

---

### Problema: "Login não funciona"

**Erro:**
```
Error: Login failed
```

**Solução:**
```powershell
# 1. Verificar credenciais
# Email: admin@attendance.com (exatamente assim)
# Senha: admin123

# 2. Verificar se seed rodou
cd backend
npm run seed

# 3. Verificar MongoDB tem dados
# Acesse https://cloud.mongodb.com
# Database → Collections → Users
# Deve ter usuário "Administrador" com email "admin@attendance.com"

# 4. Abrir console (F12) → Network → verificar resposta /api/auth/login
```

---

### Problema: "Planilha carrega em branco"

**Sintoma:**
```
Login funciona mas planilha não mostra nada
```

**Solução:**
```powershell
# 1. Abrir F12 → Console (procurar erros vermelhos)

# 2. Verificar se seed criou dados
# MongoDB Atlas → Collections → AttendanceRecords
# Deve ter registros

# 3. Se não tiver, rodar seed novamente
cd backend
npm run seed

# 4. Verificar backend está retornando dados
# F12 → Network → GET /api/attendance/records
# Deve retornar array com dados
```

---

### Problema: "Ports já em uso"

**Erro:**
```
error: Port 8080 is already in use
error: Port 5000 is already in use
```

**Solução:**
```powershell
# Opção 1: Fechar outras aplicações usando as portas
# Ver qual processo está usando:
netstat -ano | findstr :8080
netstat -ano | findstr :5000

# Opção 2: Usar outras portas
# Editar vite.config.ts (frontend) - mudar port: 8080
# Editar .env (backend) - mudar PORT=5000

# Opção 3: Matar processo (último recurso)
taskkill /PID <PID> /F
```

---

### Problema: "TypeScript errors"

**Erro no terminal:**
```
error TS2307: Cannot find module '@/components/...'
```

**Solução:**
```powershell
# 1. Verificar tsconfig.json tem "@" alias
# Frontend: frontend/tsconfig.json deve ter:
# "baseUrl": ".",
# "paths": { "@/*": ["src/*"] }

# 2. Se falta, adicionar manualmente

# 3. Reiniciar servidor (CTRL+C + npm run dev)
```

---

## 🎉 Checklist de Sucesso

```
✅ Node.js instalado (npm -v)
✅ Backend pasta tem .env com MONGODB_URI
✅ Frontend npm install rodou
✅ Seed rodou com sucesso (4 supervisores criados)
✅ Backend rodando em http://localhost:5000
✅ Frontend rodando em http://localhost:8080
✅ Login página aparece
✅ Login com admin@attendance.com funciona
✅ Planilha carrega com dados
✅ Consegue editar célula
✅ Consegue adicionar justificativa
✅ Consegue exportar CSV
✅ Logout funciona
```

---

## 📚 Próximas Leituras

1. **Para começar rápido:** `QUICK_START.md`
2. **Para visão técnica:** `OVERVIEW.md`
3. **Para mapa visual:** `MAPAMENTAL.md`
4. **Para status completo:** `CHECKLIST.md`

---

**Parabéns! Você tem tudo pronto para usar o APP FALTAS!** 🚀
