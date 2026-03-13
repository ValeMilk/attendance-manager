# ✅ CHECKLIST DE DEPLOY VPS

## 📝 Antes de Fazer Upload para o VPS

### 1. Configure o arquivo .env

- [ ] Copiar `.env.production` para `.env`
  ```bash
  cp .env.production .env
  ```

- [ ] Editar `.env` com suas credenciais:
  - [ ] `MONGODB_URI` - String de conexão do MongoDB Atlas
  - [ ] `JWT_SECRET` - String aleatória longa (32+ caracteres)
  - [ ] `JWT_REFRESH_SECRET` - Outra string aleatória longa

**💡 Gerar secrets seguros:**
```bash
# Linux/Mac/Git Bash:
openssl rand -base64 32

# PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 2. Testar localmente (Opcional)

- [ ] Build local: `docker-compose build`
- [ ] Iniciar: `docker-compose up -d`
- [ ] Testar: http://localhost:8881

---

## 🚀 Deploy no VPS

### 3. Conectar ao VPS

```bash
ssh root@72.61.62.17
```

### 4. Preparar diretório

```bash
mkdir -p /opt/attendance-manager
cd /opt/attendance-manager
```

### 5. Fazer Upload dos Arquivos

**Opção A: SCP (do seu PC)**
```bash
# Windows (PowerShell)
scp -r C:\Users\LENOVO_059\Desktop\attendance-manager\* root@72.61.62.17:/opt/attendance-manager/

# Linux/Mac
scp -r ~/attendance-manager/* root@72.61.62.17:/opt/attendance-manager/
```

**Opção B: Git (no VPS)**
```bash
cd /opt/attendance-manager
git clone seu-repositorio.git .
```

### 6. Verificar arquivo .env

```bash
# No VPS
cd /opt/attendance-manager
ls -la .env

# Se não existir, criar:
cp .env.production .env
nano .env  # ou vim .env
```

### 7. Executar Deploy

```bash
# Método 1: Script automático
chmod +x deploy.sh
./deploy.sh

# Método 2: Manual
docker-compose build
docker-compose up -d
docker-compose logs -f
```

### 8. Verificar se está rodando

```bash
# Status dos containers
docker-compose ps

# Logs
docker-compose logs -f

# Testar URLs
curl http://localhost:8881
curl http://localhost:5551/api/auth/profile
```

### 9. Popular banco de dados

```bash
docker-compose exec backend npm run seed
```

### 10. Configurar Firewall (se necessário)

```bash
# Ubuntu/Debian
ufw allow 8881/tcp
ufw allow 5551/tcp
ufw reload

# CentOS/RHEL
firewall-cmd --permanent --add-port=8881/tcp
firewall-cmd --permanent --add-port=5551/tcp
firewall-cmd --reload
```

---

## 🎯 Verificações Finais

### 11. Testar do seu navegador

- [ ] Frontend: http://72.61.62.17:8881
- [ ] Login com: `admin@attendance.com` / `admin123`
- [ ] Backend: http://72.61.62.17:5551/api/auth/profile

### 12. Monitoramento

```bash
# Ver uso de recursos
docker stats

# Ver logs em tempo real
docker-compose logs -f

# Ver espaço em disco
df -h
docker system df
```

---

## 🔧 Comandos Úteis no VPS

```bash
# Ver status
docker-compose ps

# Restart
docker-compose restart

# Parar
docker-compose down

# Rebuild após mudanças
docker-compose up -d --build

# Ver logs de um serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend

# Entrar no container (debug)
docker-compose exec backend sh
docker-compose exec frontend sh

# Limpar recursos antigos
docker system prune -f
```

---

## 🐛 Troubleshooting

### Container não inicia:
```bash
docker-compose logs backend
docker-compose logs frontend
```

### Erro de conexão MongoDB:
```bash
docker-compose exec backend env | grep MONGODB_URI
```

### Porta já em uso:
```bash
netstat -tulpn | grep 8881
netstat -tulpn | grep 5551
```

### Rebuild forçado:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## ✅ Deploy Bem-Sucedido!

Se tudo funcionou, você deve ter:

- ✅ Containers rodando: `docker-compose ps` mostra UP
- ✅ Frontend acessível: http://72.61.62.17:8881
- ✅ Backend respondendo: http://72.61.62.17:5551
- ✅ Login funcionando
- ✅ Dados persistidos no MongoDB Atlas

---

## 📚 Documentação

- [DOCKER.md](DOCKER.md) - Guia rápido Docker
- [DEPLOY.md](DEPLOY.md) - Guia completo de deploy
- [README.md](README.md) - Visão geral do projeto
