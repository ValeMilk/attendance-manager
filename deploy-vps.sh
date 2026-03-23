#!/bin/bash
# ================================================
# DEPLOY COMPLETO - Attendance Manager VPS
# Execute: bash deploy-vps.sh
# ================================================

echo "🚀 Iniciando deploy na VPS..."
echo ""

# 1. Remover instalação antiga se existir
echo "🧹 Limpando instalação antiga..."
cd /opt
rm -rf attendance-manager
echo ""

# 2. Clonar repositório do GitHub
echo "📦 Clonando repositório..."
git clone https://github.com/ValeMilk/attendance-manager.git
cd attendance-manager
echo ""

# 3. Criar arquivo .env
echo "📝 Criando arquivo .env..."
cat > .env << 'EOF'
# ========================================
# DOCKER PRODUCTION ENVIRONMENT
# ========================================

# MongoDB Atlas (Cloud Database)
MONGODB_URI=mongodb+srv://miqueiascirino_db_user:valemilk123456789@dbvale.chv7pdf.mongodb.net/attendance-manager?retryWrites=true&w=majority&appName=dbvale

# JWT Secrets
JWT_SECRET=0f3b9c7a-8d2e-4f1b-9c6e-6a2d9b5c1e7f-20260303
JWT_REFRESH_SECRET=b1a7d4e2-3c9f-4a2b-8d5f-9c3e2b7a6f4d-20260303

# Server Config
PORT=5000
NODE_ENV=production

# Portas (configuradas no docker-compose.yml)
# Frontend: http://72.61.62.17:8881
# Backend: http://72.61.62.17:5551
EOF
echo "✅ Arquivo .env criado"
echo ""

# 4. Verificar Docker
echo "🐳 Verificando Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não instalado!"
    exit 1
fi
echo "✅ Docker instalado"
echo ""

# 5. Parar containers antigos
echo "🛑 Parando containers antigos..."
docker-compose down 2>/dev/null || true
echo ""

# 6. Build das imagens
echo "🔨 Construindo imagens Docker (isso pode demorar alguns minutos)..."
docker-compose build --no-cache
echo ""

# 7. Iniciar containers
echo "🚀 Iniciando containers..."
docker-compose up -d
echo ""

# 8. Aguardar inicialização
echo "⏳ Aguardando containers iniciarem..."
sleep 15
echo ""

# 9. Verificar status
echo "📊 Status dos containers:"
docker-compose ps
echo ""

# 10. Popular banco de dados
echo "🌱 Populando banco de dados (seed)..."
sleep 5
docker-compose exec -T backend npm run seed || echo "⚠️  Seed falhou, você pode executar manualmente depois"
echo ""

# 11. Ver logs
echo "📋 Últimas linhas dos logs:"
docker-compose logs --tail=30
echo ""

# 12. Teste de conectividade
echo "🔍 Testando endpoints..."
echo ""

echo "Backend (esperado 401):"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:5551/api/auth/profile || echo "⚠️  Backend não respondeu"
echo ""

echo "Frontend (esperado 200):"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:8881 || echo "⚠️  Frontend não respondeu"
echo ""

# 13. Informações finais
echo "════════════════════════════════════════════"
echo "✨ DEPLOY CONCLUÍDO!"
echo "════════════════════════════════════════════"
echo ""
echo "📍 URLs de Acesso:"
echo "   Frontend: http://72.61.62.17:8881"
echo "   Backend:  http://72.61.62.17:5551"
echo ""
echo "👤 Credenciais:"
echo "   Admin: admin@attendance.com / admin123"
echo "   Supervisor: mariana-moura@attendance.com / supervisor123"
echo ""
echo "📝 Comandos úteis:"
echo "   Ver logs:     docker-compose logs -f"
echo "   Ver status:   docker-compose ps"
echo "   Restart:      docker-compose restart"
echo "   Parar:        docker-compose down"
echo "   Executar seed: docker-compose exec backend npm run seed"
echo ""
echo "🎉 Aplicação rodando!"
echo "════════════════════════════════════════════"
