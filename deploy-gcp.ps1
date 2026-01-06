# PowerShell script for deploying AGORA to Google Cloud Run
# Project: agora-481315
# Email: benjamin@ajayiwilliams.com

Write-Host "🚀 AGORA Cloud Run Deployment Script" -ForegroundColor Cyan
Write-Host "Project: agora-481315" -ForegroundColor Yellow
Write-Host ""

# Check if gcloud is installed
Write-Host "Checking Google Cloud SDK..." -ForegroundColor Cyan
try {
    $gcloudVersion = gcloud --version 2>&1
    Write-Host "✓ Google Cloud SDK found" -ForegroundColor Green
} catch {
    Write-Host "✗ Google Cloud SDK not found. Please install it first." -ForegroundColor Red
    Write-Host "Download from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Check if Docker is installed
Write-Host "Checking Docker..." -ForegroundColor Cyan
try {
    $dockerVersion = docker --version 2>&1
    Write-Host "✓ Docker found" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker not found. Please install Docker Desktop." -ForegroundColor Red
    Write-Host "Download from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Set project
Write-Host ""
Write-Host "Setting GCP project..." -ForegroundColor Cyan
gcloud config set project agora-481315
gcloud config set account benjamin@ajayiwilliams.com

# Check authentication
Write-Host "Checking authentication..." -ForegroundColor Cyan
$authStatus = gcloud auth list 2>&1
if ($authStatus -match "benjamin@ajayiwilliams.com") {
    Write-Host "✓ Authenticated as benjamin@ajayiwilliams.com" -ForegroundColor Green
} else {
    Write-Host "⚠ Not authenticated. Running gcloud auth login..." -ForegroundColor Yellow
    gcloud auth login
}

# Enable APIs
Write-Host ""
Write-Host "Enabling required APIs..." -ForegroundColor Cyan
gcloud services enable cloudbuild.googleapis.com --quiet
gcloud services enable run.googleapis.com --quiet
gcloud services enable containerregistry.googleapis.com --quiet
Write-Host "✓ APIs enabled" -ForegroundColor Green

# Configure Docker
Write-Host ""
Write-Host "Configuring Docker for GCR..." -ForegroundColor Cyan
gcloud auth configure-docker --quiet
Write-Host "✓ Docker configured" -ForegroundColor Green

# Build Docker image
Write-Host ""
Write-Host "Building Docker image..." -ForegroundColor Cyan
Write-Host "This may take 5-10 minutes..." -ForegroundColor Yellow
docker build -t gcr.io/agora-481315/agora-react:latest .

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Docker build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Docker image built successfully" -ForegroundColor Green

# Push to Container Registry
Write-Host ""
Write-Host "Pushing image to Google Container Registry..." -ForegroundColor Cyan
Write-Host "This may take 5-10 minutes depending on your internet speed..." -ForegroundColor Yellow
docker push gcr.io/agora-481315/agora-react:latest

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Docker push failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Image pushed successfully" -ForegroundColor Green

# Deploy to Cloud Run
Write-Host ""
Write-Host "Deploying to Cloud Run..." -ForegroundColor Cyan
gcloud run deploy agora-react `
    --image gcr.io/agora-481315/agora-react:latest `
    --platform managed `
    --region us-central1 `
    --allow-unauthenticated `
    --port 8080 `
    --memory 512Mi `
    --cpu 1 `
    --timeout 300 `
    --max-instances 10 `
    --project agora-481315

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Deployment successful!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Get your Cloud Run URL from the output above" -ForegroundColor Yellow
Write-Host "2. Update manifest.xml with the new URL" -ForegroundColor Yellow
Write-Host "3. Rebuild and redeploy" -ForegroundColor Yellow
Write-Host ""
Write-Host "To view logs:" -ForegroundColor Cyan
Write-Host "gcloud run services logs tail agora-react --region us-central1 --project agora-481315" -ForegroundColor Yellow
