#!/bin/bash

# Build Docker images for MangaDen
# Usage: ./scripts/docker-build.sh [backend|frontend|all]

set -e

BUILD_TARGET=${1:-all}

echo "🐳 Building Docker images for MangaDen..."

case $BUILD_TARGET in
    backend)
        echo "Building backend image..."
        docker build -f docker/Dockerfile.backend -t mangaden-backend:latest .
        echo "✅ Backend image built successfully"
        ;;
    frontend)
        echo "Building frontend image..."
        docker build -f docker/Dockerfile.frontend -t mangaden-frontend:latest .
        echo "✅ Frontend image built successfully"
        ;;
    all)
        echo "Building all images..."
        docker build -f docker/Dockerfile.backend -t mangaden-backend:latest .
        echo "✅ Backend image built successfully"
        docker build -f docker/Dockerfile.frontend -t mangaden-frontend:latest .
        echo "✅ Frontend image built successfully"
        ;;
    *)
        echo "Usage: $0 [backend|frontend|all]"
        exit 1
        ;;
esac

echo ""
echo "Available images:"
docker images | grep mangaden || echo "No mangaden images found"
