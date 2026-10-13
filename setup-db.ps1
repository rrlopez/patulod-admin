# PATULOD Admin Database Setup Script
# This script sets up the PostgreSQL database using Docker

Write-Host "🚀 PATULOD Admin Database Setup" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Green

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker ps > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Docker is running`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed or not in PATH." -ForegroundColor Red
    exit 1
}

# Start PostgreSQL container
Write-Host "Starting PostgreSQL container..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start PostgreSQL container" -ForegroundColor Red
    exit 1
}
Write-Host "✅ PostgreSQL container started`n" -ForegroundColor Green

# Wait for PostgreSQL to be healthy
Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$ready = $false

while ($attempt -lt $maxAttempts -and -not $ready) {
    $attempt++
    $health = docker inspect --format='{{.State.Health.Status}}' patulod-postgres 2>$null
    
    if ($health -eq "healthy") {
        $ready = $true
        Write-Host "✅ PostgreSQL is ready`n" -ForegroundColor Green
    } else {
        Write-Host "  Attempt $attempt/$maxAttempts - Status: $health" -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if (-not $ready) {
    Write-Host "❌ PostgreSQL did not become healthy in time" -ForegroundColor Red
    Write-Host "Check logs with: docker-compose logs postgres" -ForegroundColor Yellow
    exit 1
}

# Check if Better Auth secret is set
Write-Host "Checking Better Auth configuration..." -ForegroundColor Yellow
$envContent = Get-Content .env.local -Raw
if ($envContent -match 'BETTER_AUTH_SECRET=\s*$' -or $envContent -match 'BETTER_AUTH_SECRET=\s*#') {
    Write-Host "⚠️  Better Auth secret not set!" -ForegroundColor Yellow
    Write-Host "`nGenerating Better Auth secret..." -ForegroundColor Yellow
    
    $secret = npx -y @better-auth/cli secret 2>&1 | Select-String -Pattern "BETTER_AUTH_SECRET=" | ForEach-Object { $_.ToString().Split('=')[1].Trim() }
    
    if ($secret) {
        $envContent = $envContent -replace 'BETTER_AUTH_SECRET=.*', "BETTER_AUTH_SECRET=$secret"
        Set-Content -Path .env.local -Value $envContent
        Write-Host "✅ Better Auth secret generated and saved`n" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Could not auto-generate secret. Please run manually:" -ForegroundColor Yellow
        Write-Host "    npx -y @better-auth/cli secret`n" -ForegroundColor Cyan
    }
} else {
    Write-Host "✅ Better Auth secret is configured`n" -ForegroundColor Green
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
pnpm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed`n" -ForegroundColor Green

# Generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Yellow
pnpm db:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Prisma client generated`n" -ForegroundColor Green

# Push database schema
Write-Host "Pushing database schema..." -ForegroundColor Yellow
pnpm db:push
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push database schema" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Database schema created`n" -ForegroundColor Green

# Seed database
Write-Host "Seeding database with admin user..." -ForegroundColor Yellow
pnpm db:seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to seed database" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Database seeded`n" -ForegroundColor Green

# Success message
Write-Host "================================" -ForegroundColor Green
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Green

Write-Host "📧 Admin Login Credentials:" -ForegroundColor Cyan
Write-Host "   Email:    admin@patulod.com" -ForegroundColor White
Write-Host "   Password: admin123`n" -ForegroundColor White

Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Start the dev server: pnpm dev" -ForegroundColor White
Write-Host "   2. Open: http://localhost:3000/login" -ForegroundColor White
Write-Host "   3. Login with the credentials above`n" -ForegroundColor White

Write-Host "📚 Useful Commands:" -ForegroundColor Cyan
Write-Host "   View database: pnpm db:studio" -ForegroundColor White
Write-Host "   Stop database: docker-compose stop" -ForegroundColor White
Write-Host "   View logs:     docker-compose logs -f postgres`n" -ForegroundColor White
