# AGORA Production Build Script
# Cleans and builds the application for deployment

Write-Host "🚀 Starting AGORA Production Build..." -ForegroundColor Green

# Step 1: Clean previous builds
Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "build") {
    Remove-Item -Recurse -Force "build"
    Write-Host "✅ Removed previous build directory" -ForegroundColor Green
}

# Step 2: Clean node_modules and reinstall (optional)
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm ci --only=production

# Step 3: Build the application
Write-Host "🔨 Building application..." -ForegroundColor Yellow
npm run build

# Step 4: Verify build
if (Test-Path "build") {
    Write-Host "✅ Build completed successfully!" -ForegroundColor Green
    Write-Host "📁 Build output: ./build" -ForegroundColor Cyan
    
    # Show build size
    $buildSize = (Get-ChildItem -Recurse "build" | Measure-Object -Property Length -Sum).Sum
    $buildSizeMB = [math]::Round($buildSize / 1MB, 2)
    Write-Host "📊 Build size: $buildSizeMB MB" -ForegroundColor Cyan
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Production build ready for deployment!" -ForegroundColor Green
