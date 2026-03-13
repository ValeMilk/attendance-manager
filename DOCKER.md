# 🐳 Docker - Quick Start

## ⚡ Deploy Rápido (5 minutos)

### 1. Configure o arquivo .env

```bash
# Copie o arquivo de exemplo
cp .env.production .env

# Edite com suas credenciais reais
# - MONGODB_URI do MongoDB Atlas
# - JWT_SECRET e JWT_REFRESH_SECRET (strings aleatórias longas)
```

### 2. Execute o script de deploy

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

**Windows (PowerShell):**
```powershell
.\deploy.ps1
```

### 3. Acesse a aplicação

- **Frontend:** http://seu-ip:8881
- **Backend:** http://seu-ip:5551

**Login:**
- Admin: `admin@attendance.com` / `admin123`

---

## 🔧 Comandos Manuais

### Build e Start

```bash
# Build das imagens
docker-compose build

# Iniciar containers
docker-compose up -d

# Ver logs
docker-compose logs -f

# Ver status
docker-compose ps
```

### Manutenção

```bash
# Parar containers
docker-compose down

# Restart
docker-compose restart

# Rebuild após mudanças
docker-compose up -d --build

# Ver uso de recursos
docker stats
```

### Executar Seed (popular banco de dados)

```bash
docker-compose exec backend npm run seed
```

---

## 📁 Arquivos Docker Criados

- **docker-compose.yml** - Orquestração dos containers
- **backend/Dockerfile** - Imagem do backend
- **frontend/Dockerfile** - Imagem do frontend
- **frontend/nginx.conf** - Configuração do Nginx
- **.env.production** - Template de variáveis de ambiente
- **deploy.sh** / **deploy.ps1** - Scripts de deploy automático
- **DEPLOY.md** - Guia completo de deploy

---

## 🌐 Portas

- **8881** → Frontend (Nginx + React)
- **5551** → Backend (Node.js + Express)

---

## 🔍 Troubleshooting

### Container não inicia:
```bash
docker-compose logs backend
docker-compose logs frontend
```

### Erro de conexão MongoDB:
```bash
# Verificar variável de ambiente
docker-compose exec backend env | grep MONGODB_URI
```

### Porta já em uso:
```bash
# Ver o que está usando a porta
netstat -tulpn | grep 8881
netstat -tulpn | grep 5551

# Ou mude as portas no docker-compose.yml
```

---

## 📖 Documentação Completa

Veja [DEPLOY.md](DEPLOY.md) para o guia completo de deploy na VPS.
