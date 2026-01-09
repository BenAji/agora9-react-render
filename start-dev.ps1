# Development Server Startup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting AGORA React Development Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ npm install failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
    Write-Host ""
}

# Set PORT from .env.local if it exists
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local"
    $portLine = $envContent | Where-Object { $_ -match '^PORT=(\d+)$' }
    if ($portLine) {
        $env:PORT = ($portLine -split '=')[1].Trim()
        Write-Host "📍 Using PORT=$env:PORT from .env.local" -ForegroundColor Green
    }
}

# Default to 3000 if not set
if (-not $env:PORT) {
    $env:PORT = 3000
    Write-Host "📍 Using default PORT=3000" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Starting React development server..." -ForegroundColor Green
Write-Host "   The app will open at: http://localhost:$env:PORT" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server
npm start

