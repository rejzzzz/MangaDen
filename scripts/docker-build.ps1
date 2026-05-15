# Build Docker images for MangaDen (PowerShell)
# Usage: .\scripts\docker-build.ps1 [backend|frontend|all]

param(
    [string]$BuildTarget = "all"
)

$ErrorActionPreference = "Stop"

Write-Host "🐳 Building Docker images for MangaDen..." -ForegroundColor Green

switch ($BuildTarget) {
    "backend" {
        Write-Host "Building backend image..." -ForegroundColor Cyan
        docker build -f docker/Dockerfile.backend -t mangaden-backend:latest .
        Write-Host "✅ Backend image built successfully" -ForegroundColor Green
    }
    "frontend" {
        Write-Host "Building frontend image..." -ForegroundColor Cyan
        docker build -f docker/Dockerfile.frontend -t mangaden-frontend:latest .
        Write-Host "✅ Frontend image built successfully" -ForegroundColor Green
    }
    "all" {
        Write-Host "Building all images..." -ForegroundColor Cyan
        docker build -f docker/Dockerfile.backend -t mangaden-backend:latest .
        Write-Host "✅ Backend image built successfully" -ForegroundColor Green
        docker build -f docker/Dockerfile.frontend -t mangaden-frontend:latest .
        Write-Host "✅ Frontend image built successfully" -ForegroundColor Green
    }
    default {
        Write-Host "Usage: $($MyInvocation.MyCommand.Name) [backend|frontend|all]" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "Available images:" -ForegroundColor Yellow
docker images | Select-String "mangaden" | ForEach-Object { Write-Host $_ }
