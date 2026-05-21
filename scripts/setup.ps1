# MangaDen Setup Script (PowerShell)
# Installs dependencies and runs initial database migrations

$ErrorActionPreference = "Stop"

Write-Host "🚀 Setting up MangaDen..." -ForegroundColor Green

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
pnpm install

# Run database migrations
Write-Host "🗄️  Running database migrations..." -ForegroundColor Cyan
pnpm db:migrate

# Optional: Seed database
$response = Read-Host "Do you want to seed the database with sample data? (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host "🌱 Seeding database..." -ForegroundColor Cyan
    pnpm db:seed
}

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Copy environment files if not already done:"
Write-Host "   - backend/.env (from backend/.env.example)"
Write-Host "   - frontend/.env (from frontend/.env.example)"
Write-Host ""
Write-Host "2. Start development servers:"
Write-Host "   pnpm dev"
Write-Host ""
Write-Host "3. Frontend will be available at: http://localhost:4321"
Write-Host "4. Backend will be available at: http://localhost:3000"
