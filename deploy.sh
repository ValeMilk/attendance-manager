#!/bin/bash

# ================================================
# SCRIPT DE DEPLOY RÁPIDO - Attendance Manager
# ================================================

set -e  # Parar em caso de erro

echo "🚀 Iniciando deploy do Attendance Manager..."
echo ""

# Verificar se o .env existe
if [ ! -f .env ]; then
    echo "❌ ERRO: Arquivo .env não encontrado!"
    echo ""
    echo "📝 Crie o arquivo .env a partir do .env.production:"
    echo "   cp .env.production .env"
    echo ""
    echo "   Depois edite o .env com suas credenciais reais."
    exit 1
fi

echo "✅ Arquivo .env encontrado"
echo ""

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ ERRO: Docker não está instalado!"
    exit 1
fi

echo "✅ Docker instalado"
echo ""

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ ERRO: Docker Compose não está instalado!"
    exit 1
fi

echo "✅ Docker Compose instalado"
echo ""

# Parar containers antigos se existirem
echo "🛑 Parando containers antigos..."
docker-compose down || true
echo ""

# Build das imagens
echo "🔨 Construindo imagens Docker..."
docker-compose build --no-cache
echo ""

# Iniciar containers
echo "🚀 Iniciando containers..."
docker-compose up -d
echo ""

# Aguardar alguns segundos
echo "⏳ Aguardando containers iniciarem..."
sleep 10
echo ""

# Verificar status
echo "📊 Status dos containers:"
docker-compose ps
echo ""

# Verificar logs
echo "📋 Últimas linhas dos logs:"
docker-compose logs --tail=20
echo ""

# Testar endpoints
echo "🔍 Testando endpoints..."
echo ""

BACKEND_URL="http://localhost:5551/api/auth/profile"
FRONTEND_URL="http://localhost:8881"

echo "Backend (deve retornar 401): $BACKEND_URL"
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL || echo "000")
if [ "$BACKEND_STATUS" = "401" ] || [ "$BACKEND_STATUS" = "403" ]; then
    echo "✅ Backend funcionando (status: $BACKEND_STATUS)"
else
    echo "⚠️  Backend retornou status: $BACKEND_STATUS (esperado: 401)"
fi
echo ""

echo "Frontend: $FRONTEND_URL"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL || echo "000")
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ Frontend funcionando (status: $FRONTEND_STATUS)"
else
    echo "⚠️  Frontend retornou status: $FRONTEND_STATUS (esperado: 200)"
fi
echo ""

# Instruções finais
echo "✨ Deploy concluído!"
echo ""
echo "📍 Acesse a aplicação:"
echo "   Frontend: http://SEU-IP:8881"
echo "   Backend:  http://SEU-IP:5551"
echo ""
echo "👤 Credenciais padrão:"
echo "   Admin: admin@attendance.com / admin123"
echo ""
echo "📝 Comandos úteis:"
echo "   Ver logs:        docker-compose logs -f"
echo "   Ver status:      docker-compose ps"
echo "   Parar:           docker-compose down"
echo "   Restart:         docker-compose restart"
echo "   Executar seed:   docker-compose exec backend npm run seed"
echo ""
echo "🎉 Tudo pronto!"
