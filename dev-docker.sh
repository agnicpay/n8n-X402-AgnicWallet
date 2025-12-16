#!/bin/bash

# Script to run n8n Docker with local AgnicWallet nodes for development

set -e

echo "🔨 Building package..."
npm run build

echo "📦 Creating package tarball..."
npm pack --silent
PACKAGE_FILE=$(ls -t n8n-nodes-agnicwallet-*.tgz | head -1)
echo "   Created: $PACKAGE_FILE"

echo "🛑 Stopping existing container (if running)..."
docker stop agnic-wallet-n8n 2>/dev/null || true
docker rm agnic-wallet-n8n 2>/dev/null || true

echo "🐳 Starting AgnicWallet n8n Docker container..."
docker run -d \
  --name agnic-wallet-n8n \
  -p 3006:5678 \
  --user root \
  -e NODE_PATH=/usr/local/lib/node_modules \
  -e N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom \
  -v ~/.n8n:/home/node/.n8n \
  -v "$(pwd)/$PACKAGE_FILE:/tmp/package.tgz:ro" \
  -v "$(pwd)/docker-init.sh:/docker-init.sh:ro" \
  --entrypoint /docker-init.sh \
  n8nio/n8n:latest

echo "✅ AgnicWallet n8n is running!"
echo ""
echo "📊 Access n8n at: http://localhost:3006"
echo "📋 View logs with: docker logs -f agnic-wallet-n8n"
echo "🛑 Stop with: docker stop agnic-wallet-n8n"
echo ""
echo "🔄 To rebuild after code changes:"
echo "   1. npm run build"
echo "   2. ./dev-docker.sh"

