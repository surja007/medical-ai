#!/bin/bash

# Render build script for backend
echo "🏥 Building Smart Health Backend for Render..."

# Install dependencies
npm ci --only=production

# Create necessary directories
mkdir -p uploads logs

# Set proper permissions
chmod 755 uploads logs

echo "✅ Backend build complete!"