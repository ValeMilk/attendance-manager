# 🚀 COMANDOS PARA DEPLOY NA VPS

## 🆕 PRIMEIRA VEZ (Deploy Inicial)

Conecte à VPS e execute:

```bash
ssh root@72.61.62.17
```

Depois copie e cole **TODO O BLOCO** abaixo:

```bash
cd /opt && \
git clone https://github.com/ValeMilk/attendance-manager.git && \
cd attendance-manager && \
cat > .env << 'EOF'
MONGODB_URI=mongodb+srv://miqueiascirino_db_user:valemilk123456789@dbvale.chv7pdf.mongodb.net/attendance-manager?retryWrites=true&w=majority&appName=dbvale
JWT_SECRET=0f3b9c7a-8d2e-4f1b-9c6e-6a2d9b5c1e7f-20260303
JWT_REFRESH_SECRET=b1a7d4e2-3c9f-4a2b-8d5f-9c3e2b7a6f4d-20260303
PORT=5000
NODE_ENV=production
EOF
echo "✅ .env criado" && \
docker-compose build && \
docker-compose up -d && \
sleep 15 && \
echo "🎉 DEPLOY CONCLUÍDO!" && \
echo "" && \
docker-compose ps && \
echo "" && \
docker-compose logs --tail=20 && \
echo "" && \
echo "📍 Acesse: http://72.61.62.17:8881" && \
echo "👤 Login: admin / admin"
```

Depois execute o seed (popular banco de dados):

```bash
docker-compose exec backend npm run seed
```

---

## 🔄 ATUALIZAÇÕES (Quando já está rodando)

Quando você fizer mudanças no código e der push no GitHub, use este comando:

```bash
ssh root@72.61.62.17
```

Depois copie e cole **TODO O BLOCO** abaixo:

```bash
cd /opt/attendance-manager && \
git pull origin main && \
docker-compose down && \
docker-compose build && \
docker-compose up -d && \
sleep 10 && \
echo "✅ ATUALIZAÇÃO CONCLUÍDA!" && \
echo "" && \
docker-compose ps && \
echo "" && \
docker-compose logs --tail=20
```

---

## OU Execute Passo a Passo:

### 1️⃣ Conectar à VPS
```bash
ssh root@72.61.62.17
```

### 2️⃣ Ir para o diretório e limpar instalação antiga
```bash
cd /opt
rm -rf attendance-manager
```

### 3️⃣ Clonar repositório
```bash
git clone https://github.com/ValeMilk/attendance-manager.git
cd attendance-manager
```

### 4️⃣ Criar arquivo .env
```bash
cat > .env << 'EOF'
MONGODB_URI=mongodb+srv://miqueiascirino_db_user:valemilk123456789@dbvale.chv7pdf.mongodb.net/attendance-manager?retryWrites=true&w=majority&appName=dbvale
JWT_SECRET=0f3b9c7a-8d2e-4f1b-9c6e-6a2d9b5c1e7f-20260303
JWT_REFRESH_SECRET=b1a7d4e2-3c9f-4a2b-8d5f-9c3e2b7a6f4d-20260303
PORT=5000
NODE_ENV=production
EOF
```

### 5️⃣ Parar containers antigos
```bash
docker-compose down
```

### 6️⃣ Build das imagens Docker
```bash
docker-compose build
```

### 7️⃣ Iniciar containers
```bash
docker-compose up -d
```

### 8️⃣ Ver logs
```bash
docker-compose logs -f
```

### 9️⃣ Popular banco de dados (seed)
```bash
docker-compose exec backend npm run seed
```

### 🔟 Verificar status
```bash
docker-compose ps
```

---

## ✅ Testar Aplicação

- **Frontend:** http://72.61.62.17:8881
- **Backend:** http://72.61.62.17:5551/api/auth/profile

**Login:**
- Admin: `admin` / `admin`
- Supervisor: `mariana moura` / `supervisor123`

---

## 🔧 Comandos Úteis

```bash
# Ver logs em tempo real
docker-compose logs -f

# Ver apenas logs do backend
docker-compose logs -f backend

# Ver apenas logs do frontend
docker-compose logs -f frontend

# Ver status dos containers
docker-compose ps

# Restart de tudo
docker-compose restart

# Restart apenas backend
docker-compose restart backend

# Parar tudo
docker-compose down

# Rebuild após mudanças
git pull origin main
docker-compose up -d --build

# Ver uso de recursos
docker stats

# Entrar no container do backend (debug)
docker-compose exec backend sh

# Executar comando no backend
docker-compose exec backend npm run seed
```

---

## 🐛 Troubleshooting

### Container não inicia:
```bash
docker-compose logs backend
docker-compose logs frontend
```

### Rebuild completo:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Limpar recursos Docker:
```bash
docker system prune -f
docker volume prune -f
```

### Verificar portas em uso:
```bash
netstat -tulpn | grep 8881
netstat -tulpn | grep 5551
```

### Testar conectividade:
```bash
curl http://localhost:8881
curl http://localhost:5551/api/auth/profile
```

---

## 🔄 Atualizar Aplicação

Quando você fizer mudanças no código e der push no GitHub:

```bash
ssh root@72.61.62.17
cd /opt/attendance-manager
git pull origin main
docker-compose up -d --build
docker-compose logs -f
```

---

## 🎉 Pronto!

Sua aplicação estará rodando em:
- **http://72.61.62.17:8881**
