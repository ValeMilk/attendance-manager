# 🚀 GUIA DE DEPLOY - VPS com Docker

## 📋 Pré-requisitos

- ✅ VPS com Docker e Docker Compose instalados
- ✅ MongoDB Atlas configurado (cloud database)
- ✅ Acesso SSH ao servidor: `ssh root@72.61.62.17`
- ✅ Portas liberadas: **8881** (frontend) e **5551** (backend)

---

## 🔧 Passo 1: Preparar Variáveis de Ambiente

### No seu computador local:

1. **Copie o arquivo de exemplo:**
   ```bash
   cp .env.production .env
   ```

2. **Edite o arquivo `.env` com seus dados reais:**
   ```bash
   # No Windows
   notepad .env
   
   # Ou use VS Code
   code .env
   ```

3. **Configure as variáveis:**
   ```env
   # Sua string de conexão do MongoDB Atlas
   MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/attendance-manager
   
   # Gere secrets seguros (use o comando abaixo ou crie strings aleatórias)
   JWT_SECRET=cole_aqui_um_secret_aleatorio_longo
   JWT_REFRESH_SECRET=cole_aqui_outro_secret_aleatorio_longo
   ```

**💡 Dica para gerar secrets seguros:**
```bash
# No Linux/Mac ou Git Bash no Windows:
openssl rand -base64 32

# No PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

## 📦 Passo 2: Enviar Código para o VPS

### Opção A: Via Git (Recomendado)

```bash
# No VPS
ssh root@72.61.62.17

# Criar diretório
mkdir -p /opt/attendance-manager
cd /opt/attendance-manager

# Clonar repositório (se estiver no GitHub/GitLab)
git clone seu-repositorio.git .

# OU fazer upload manual (veja Opção B)
```

### Opção B: Via SCP (Upload manual)

```bash
# No seu computador local (PowerShell ou terminal)
# Enviar todo o projeto para o VPS
scp -r C:\Users\LENOVO_059\Desktop\attendance-manager root@72.61.62.17:/opt/
```

---

## 🚀 Passo 3: Deploy com Docker Compose

### No VPS (via SSH):

```bash
# Conectar ao VPS
ssh root@72.61.62.17

# Ir para o diretório do projeto
cd /opt/attendance-manager

# Verificar se o .env está presente
ls -la .env

# Build e iniciar os containers
docker-compose up -d --build

# Verificar status dos containers
docker-compose ps

# Ver logs em tempo real
docker-compose logs -f

# Ver logs apenas do backend
docker-compose logs -f backend

# Ver logs apenas do frontend
docker-compose logs -f frontend
```

---

## 🔍 Passo 4: Verificar se Está Funcionando

### Teste as URLs:

1. **Frontend:**
   ```
   http://72.61.62.17:8881
   ```

2. **Backend (health check):**
   ```
   http://72.61.62.17:5551/api/auth/profile
   ```
   (Deve retornar erro 401 - isso é normal, significa que está funcionando)

### Comandos úteis:

```bash
# Ver status dos containers
docker-compose ps

# Ver logs
docker-compose logs -f

# Restart dos serviços
docker-compose restart

# Parar tudo
docker-compose down

# Parar e remover volumes
docker-compose down -v

# Rebuild após mudanças no código
docker-compose up -d --build

# Ver uso de recursos
docker stats
```

---

## 🎯 Passo 5: Popular o Banco de Dados (Seed)

### Executar seed dentro do container do backend:

```bash
# No VPS
cd /opt/attendance-manager

# Executar comando dentro do container
docker-compose exec backend node dist/scripts/seed.js

# OU se o script não estiver buildado:
docker-compose exec backend npm run seed
```

**Nota:** O script de seed criará os usuários demo:
- Admin: `admin@attendance.com` / `admin123`
- Supervisores: `mariana-moura@attendance.com` / `supervisor123`

---

## 🔐 Passo 6: Configurar Firewall (Opcional)

Se o firewall estiver bloqueando as portas:

```bash
# Ubuntu/Debian (UFW)
ufw allow 8881/tcp
ufw allow 5551/tcp
ufw reload

# CentOS/RHEL (firewalld)
firewall-cmd --permanent --add-port=8881/tcp
firewall-cmd --permanent --add-port=5551/tcp
firewall-cmd --reload

# iptables
iptables -A INPUT -p tcp --dport 8881 -j ACCEPT
iptables -A INPUT -p tcp --dport 5551 -j ACCEPT
```

---

## 🌐 Passo 7: Configurar Domínio (Opcional)

Se você tiver um domínio (ex: `attendance.seudominio.com`):

### Opção A: Nginx como Reverse Proxy (no host)

```nginx
# /etc/nginx/sites-available/attendance
server {
    listen 80;
    server_name attendance.seudominio.com;

    location / {
        proxy_pass http://localhost:8881;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Ativar configuração
ln -s /etc/nginx/sites-available/attendance /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# Instalar SSL com Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d attendance.seudominio.com
```

---

## 🔄 Atualizações e Manutenção

### Atualizar o código:

```bash
# No VPS
cd /opt/attendance-manager

# Se usando Git
git pull origin main

# Rebuild e restart
docker-compose up -d --build

# Ver logs para verificar
docker-compose logs -f
```

### Backup do MongoDB Atlas:

O MongoDB Atlas faz backups automáticos, mas você pode criar snapshots manuais no painel do Atlas.

### Limpar recursos Docker:

```bash
# Remover containers parados
docker container prune -f

# Remover imagens não utilizadas
docker image prune -a -f

# Remover volumes não utilizados
docker volume prune -f

# Limpar tudo (cuidado!)
docker system prune -a -f
```

---

## 🐛 Troubleshooting

### Container não inicia:

```bash
# Ver logs detalhados
docker-compose logs backend
docker-compose logs frontend

# Verificar se as portas estão em uso
netstat -tulpn | grep 8881
netstat -tulpn | grep 5551

# Entrar no container para debug
docker-compose exec backend sh
docker-compose exec frontend sh
```

### Erro de conexão com MongoDB:

```bash
# Verificar se a string MONGODB_URI está correta
docker-compose exec backend env | grep MONGODB_URI

# Testar conexão manualmente
docker-compose exec backend node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('OK')).catch(console.error)"
```

### Frontend não carrega:

```bash
# Verificar se o Nginx está rodando
docker-compose exec frontend ps aux

# Ver configuração do Nginx
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf

# Testar configuração do Nginx
docker-compose exec frontend nginx -t
```

### Porta já em uso:

```bash
# Descobrir o que está usando a porta
lsof -i :8881
lsof -i :5551

# Parar o processo (substitua PID)
kill -9 PID

# Ou mudar as portas no docker-compose.yml
```

---

## 📊 Monitoramento

### Ver uso de recursos:

```bash
# Uso de CPU e memória
docker stats

# Ver espaço em disco
df -h
docker system df
```

### Logs persistentes:

```bash
# Exportar logs para arquivo
docker-compose logs > logs.txt

# Ver logs das últimas 100 linhas
docker-compose logs --tail=100

# Seguir logs em tempo real
docker-compose logs -f --tail=50
```

---

## ✅ Checklist de Deploy

- [ ] VPS com Docker instalado
- [ ] Portas 8881 e 5551 liberadas no firewall
- [ ] MongoDB Atlas configurado
- [ ] Arquivo `.env` criado com variáveis corretas
- [ ] Código enviado para o VPS
- [ ] `docker-compose up -d --build` executado
- [ ] Containers rodando: `docker-compose ps`
- [ ] Frontend acessível: http://72.61.62.17:8881
- [ ] Backend respondendo: http://72.61.62.17:5551/api/...
- [ ] Seed executado: usuários criados
- [ ] Login funcionando no frontend

---

## 🎉 Pronto!

Sua aplicação está rodando em:

- **Frontend:** http://72.61.62.17:8881
- **Backend:** http://72.61.62.17:5551

**Credenciais padrão:**
- Admin: `admin@attendance.com` / `admin123`
- Supervisor: `mariana-moura@attendance.com` / `supervisor123`

---

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs: `docker-compose logs -f`
2. Verifique o status: `docker-compose ps`
3. Verifique as variáveis: `docker-compose exec backend env`
4. Teste a conexão MongoDB no Atlas
