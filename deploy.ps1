# ================================================
# SCRIPT DE DEPLOY RÁPIDO - Attendance Manager (PowerShell)
# ================================================

Write-Host "🚀 Iniciando deploy do Attendance Manager..." -ForegroundColor Cyan
Write-Host ""

# Verificar se o .env existe
if (-not (Test-Path .env)) {
    Write-Host "❌ ERRO: Arquivo .env não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 Crie o arquivo .env a partir do .env.production:" -ForegroundColor Yellow
    Write-Host "   Copy-Item .env.production .env"
    Write-Host ""
    Write-Host "   Depois edite o .env com suas credenciais reais."
    exit 1
}

Write-Host "✅ Arquivo .env encontrado" -ForegroundColor Green
Write-Host ""

# Verificar se Docker está instalado
try {
    docker --version | Out-Null
    Write-Host "✅ Docker instalado" -ForegroundColor Green
} catch {
    Write-Host "❌ ERRO: Docker não está instalado!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Verificar se Docker Compose está instalado
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose instalado" -ForegroundColor Green
} catch {
    Write-Host "❌ ERRO: Docker Compose não está instalado!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Parar containers antigos se existirem
Write-Host "🛑 Parando containers antigos..." -ForegroundColor Yellow
docker-compose down 2>$null
Write-Host ""

# Build das imagens
Write-Host "🔨 Construindo imagens Docker..." -ForegroundColor Cyan
docker-compose build --no-cache
Write-Host ""

# Iniciar containers
Write-Host "🚀 Iniciando containers..." -ForegroundColor Cyan
docker-compose up -d
Write-Host ""

# Aguardar alguns segundos
Write-Host "⏳ Aguardando containers iniciarem..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
Write-Host ""

# Verificar status
Write-Host "📊 Status dos containers:" -ForegroundColor Cyan
docker-compose ps
Write-Host ""

# Verificar logs
Write-Host "📋 Últimas linhas dos logs:" -ForegroundColor Cyan
docker-compose logs --tail=20
Write-Host ""

# Testar endpoints
Write-Host "🔍 Testando endpoints..." -ForegroundColor Cyan
Write-Host ""

$backendUrl = "http://localhost:5551/api/auth/profile"
$frontendUrl = "http://localhost:8881"

Write-Host "Backend (deve retornar 401): $backendUrl"
try {
    $response = Invoke-WebRequest -Uri $backendUrl -Method GET -ErrorAction SilentlyContinue
    $status = $response.StatusCode
} catch {
    $status = $_.Exception.Response.StatusCode.Value__
}

if ($status -eq 401 -or $status -eq 403) {
    Write-Host "✅ Backend funcionando (status: $status)" -ForegroundColor Green
} else {
    Write-Host "⚠️  Backend retornou status: $status (esperado: 401)" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "Frontend: $frontendUrl"
try {
    $response = Invoke-WebRequest -Uri $frontendUrl -Method GET -ErrorAction SilentlyContinue
    $status = $response.StatusCode
} catch {
    $status = $_.Exception.Response.StatusCode.Value__
}

if ($status -eq 200) {
    Write-Host "✅ Frontend funcionando (status: $status)" -ForegroundColor Green
} else {
    Write-Host "⚠️  Frontend retornou status: $status (esperado: 200)" -ForegroundColor Yellow
}
Write-Host ""

# Instruções finais
Write-Host "✨ Deploy concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Acesse a aplicação:" -ForegroundColor Cyan
Write-Host "   Frontend: http://SEU-IP:8881"
Write-Host "   Backend:  http://SEU-IP:5551"
Write-Host ""
Write-Host "👤 Credenciais padrão:" -ForegroundColor Yellow
Write-Host "   Admin: admin@attendance.com / admin123"
Write-Host ""
Write-Host "📝 Comandos úteis:" -ForegroundColor Cyan
Write-Host "   Ver logs:        docker-compose logs -f"
Write-Host "   Ver status:      docker-compose ps"
Write-Host "   Parar:           docker-compose down"
Write-Host "   Restart:         docker-compose restart"
Write-Host "   Executar seed:   docker-compose exec backend npm run seed"
Write-Host ""
Write-Host "🎉 Tudo pronto!" -ForegroundColor Green
