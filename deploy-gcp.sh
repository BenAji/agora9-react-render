#!/bin/bash
# Bash script for deploying AGORA to Google Cloud Run
# Project: agora-481315
# Email: benjamin@ajayiwilliams.com

echo "🚀 AGORA Cloud Run Deployment Script"
echo "Project: agora-481315"
echo ""

# Check if gcloud is installed
echo "Checking Google Cloud SDK..."
if ! command -v gcloud &> /dev/null; then
    echo "✗ Google Cloud SDK not found. Please install it first."
    echo "Download from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi
echo "✓ Google Cloud SDK found"

# Check if Docker is installed
echo "Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "✗ Docker not found. Please install Docker."
    echo "Download from: https://www.docker.com/products/docker-desktop"
    exit 1
fi
echo "✓ Docker found"

# Set project
echo ""
echo "Setting GCP project..."
gcloud config set project agora-481315
gcloud config set account benjamin@ajayiwilliams.com

# Check authentication
echo "Checking authentication..."
if gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "benjamin@ajayiwilliams.com"; then
    echo "✓ Authenticated as benjamin@ajayiwilliams.com"
else
    echo "⚠ Not authenticated. Running gcloud auth login..."
    gcloud auth login
fi

# Enable APIs
echo ""
echo "Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com --quiet
gcloud services enable run.googleapis.com --quiet
gcloud services enable containerregistry.googleapis.com --quiet
echo "✓ APIs enabled"

# Configure Docker
echo ""
echo "Configuring Docker for GCR..."
gcloud auth configure-docker --quiet
echo "✓ Docker configured"

# Build Docker image
echo ""
echo "Building Docker image..."
echo "This may take 5-10 minutes..."
docker build -t gcr.io/agora-481315/agora-react:latest .

if [ $? -ne 0 ]; then
    echo "✗ Docker build failed!"
    exit 1
fi
echo "✓ Docker image built successfully"

# Push to Container Registry
echo ""
echo "Pushing image to Google Container Registry..."
echo "This may take 5-10 minutes depending on your internet speed..."
docker push gcr.io/agora-481315/agora-react:latest

if [ $? -ne 0 ]; then
    echo "✗ Docker push failed!"
    exit 1
fi
echo "✓ Image pushed successfully"

# Deploy to Cloud Run
echo ""
echo "Deploying to Cloud Run..."
gcloud run deploy agora-react \
    --image gcr.io/agora-481315/agora-react:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --timeout 300 \
    --max-instances 10 \
    --project agora-481315

if [ $? -ne 0 ]; then
    echo "✗ Deployment failed!"
    exit 1
fi

echo ""
echo "✅ Deployment successful!"
echo ""
echo "Next steps:"
echo "1. Get your Cloud Run URL from the output above"
echo "2. Update manifest.xml with the new URL"
echo "3. Rebuild and redeploy"
echo ""
echo "To view logs:"
echo "gcloud run services logs tail agora-react --region us-central1 --project agora-481315"
