#!/bin/bash

# Deploy script for Maa Care
# Usage: ./deploy.sh [environment]
# Example: ./deploy.sh production

set -e

ENVIRONMENT=${1:-production}
echo "🚀 Deploying Maa Care to $ENVIRONMENT..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo "Please create a .env file with required environment variables:"
    echo "  VITE_SUPABASE_URL"
    echo "  VITE_SUPABASE_ANON_KEY"
    echo "  VITE_GEMINI_API_KEY"
    exit 1
fi

# Validate Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Error: Node.js version 18 or higher is required${NC}"
    echo "Current version: $(node -v)"
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci

# Run type check
echo -e "${YELLOW}🔍 Running TypeScript type check...${NC}"
npm run build -- --mode $ENVIRONMENT || {
    echo -e "${RED}❌ Type check failed${NC}"
    exit 1
}

# Build the application
echo -e "${YELLOW}🏗️  Building application for $ENVIRONMENT...${NC}"
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed: dist directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo -e "${GREEN}📁 Built files are in the 'dist' directory${NC}"

# Optional: Deploy to specific platforms
case $ENVIRONMENT in
    vercel)
        echo -e "${YELLOW}🚀 Deploying to Vercel...${NC}"
        npx vercel --prod
        ;;
    netlify)
        echo -e "${YELLOW}🚀 Deploying to Netlify...${NC}"
        npx netlify deploy --prod --dir=dist
        ;;
    docker)
        echo -e "${YELLOW}🐳 Building Docker image...${NC}"
        docker build -t maa-care:latest .
        echo -e "${GREEN}✅ Docker image built successfully${NC}"
        echo "To run: docker-compose up -d"
        ;;
    *)
        echo -e "${GREEN}✅ Deployment complete!${NC}"
        echo "Manual deployment steps:"
        echo "1. Upload the 'dist' folder to your web server"
        echo "2. Configure your web server to serve index.html for all routes"
        echo "3. Ensure environment variables are set on the server"
        ;;
esac

echo -e "${GREEN}🎉 Deployment process finished!${NC}"
