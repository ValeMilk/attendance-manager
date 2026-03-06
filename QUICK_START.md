# ⚡ Quick Start - APP FALTAS

## 5 Minutos para Rodar

### Passo 1: Instalar dependências (1 min)
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Passo 2: Configurar MongoDB (1 min)
```bash
# Editar este arquivo
backend/.env

# Colar sua MONGODB_URI do MongoDB Atlas
# Exemplo:
# MONGODB_URI=mongodb+srv://user:pass@cluster0.abc123.mongodb.net/attendance-manager?retryWrites=true&w=majority
```

### Passo 3: Popular com dados CSV (1 min)
```bash
cd backend
npm run seed

# Saída esperada:
# ✓ Admin created
# ✓ "MARIANA MOURA" (15 employees)
# ✓ Seed completed successfully!
```

### Passo 4: Rodar aplicação (2 min)

**Terminal 1:**
```bash
cd backend
npm run dev
# Mensagem: "Backend listening on http://localhost:5000"
```

**Terminal 2:**
```bash
cd frontend
npm run dev
# Mensagem: "VITE v5.x.x  ready in xxx ms"
```

### Passo 5: Acessar
```
http://localhost:8080
```

## 🔓 Login (Escolha um)

| Tipo | Email | Senha |
|------|-------|-------|
| Admin | `admin@attendance.com` | `admin123` |
| Supervisor | `mariana-moura@attendance.com` | `supervisor123` |

## ✅ Está funcionando quando:
1. ✅ Página de login aparecer
2. ✅ Login funcionar
3. ✅ Planilha com dados aparecer
4. ✅ Conseguir editar células (apenas supervisor)

## 🆘 Problemas?

**Backend não conecta ao MongoDB:**
```
Erro: "Failed to connect to MongoDB"
Solução: Verificar MONGODB_URI em backend/.env
```

**Frontend exibe erro de conexão:**
```
Erro: Network error / Failed to fetch
Solução: Verificar se backend está rodando (npm run dev)
```

**CSV não foi carregado:**
```
Erro: "CSV file not found at..."
Solução: Rodar novamente: cd backend && npm run seed
```

## 🎯 Próximas Ações

1. Preencha apontamentos na planilha
2. Adicione justificativas para faltas
3. Exporte dados em CSV
4. Teste com diferentes supervisores

## 📚 Documentação Completa
- Veja `SETUP.md` para instruções detalhadas
- Veja `CHECKLIST.md` para status completo

---

**Pronto para começar?** 🚀
