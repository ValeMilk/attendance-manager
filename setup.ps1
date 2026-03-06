# Script de Setup Automatizado - APP FALTAS
# Use: .\setup.ps1

Write-Host "=== APP FALTAS - Setup Automatizado ===" -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
Write-Host "1. Verificando Node.js..." -ForegroundColor Yellow
$nodeVersion = node -v
Write-Host "✓ Node.js $nodeVersion encontrado" -ForegroundColor Green
Write-Host ""

# Backend Setup
Write-Host "2. Setup Backend..." -ForegroundColor Yellow
Push-Location backend
Write-Host "  - Instalando dependências..."
npm install --silent
Write-Host "  ✓ Dependências instaladas" -ForegroundColor Green

# Criar .env se não existir
if (-Not (Test-Path ".env")) {
    Write-Host "  - Criando arquivo .env..."
    Copy-Item ".env.example" ".env"
    Write-Host "  ⚠️  IMPORTANTE: Edite backend/.env e adicione sua MONGODB_URI" -ForegroundColor Red
    Write-Host "     Copie a connection string de: https://cloud.mongodb.com" -ForegroundColor Yellow
}
Pop-Location
Write-Host ""

# Frontend Setup
Write-Host "3. Setup Frontend..." -ForegroundColor Yellow
Push-Location frontend
Write-Host "  - Instalando dependências..."
npm install --silent
Write-Host "  ✓ Dependências instaladas" -ForegroundColor Green
Pop-Location
Write-Host ""

# Próximos passos
Write-Host "✓ Setup concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Edite arquivo: backend/.env" -ForegroundColor Yellow
Write-Host "   - Adicione sua MONGODB_URI do MongoDB Atlas" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Execute seed (popular com dados do CSV):" -ForegroundColor Yellow
Write-Host "   cd backend && npm run seed" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Abra 2 terminais e execute:" -ForegroundColor Yellow
Write-Host "   Terminal 1: cd backend && npm run dev" -ForegroundColor Gray
Write-Host "   Terminal 2: cd frontend && npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Acesse: http://localhost:8080" -ForegroundColor Cyan
Write-Host ""
Write-Host "Credenciais demo:" -ForegroundColor Cyan
Write-Host "  Admin: admin@attendance.com / admin123" -ForegroundColor Gray
Write-Host "  Supervisor: mariana-moura@attendance.com / supervisor123" -ForegroundColor Gray
Write-Host ""
