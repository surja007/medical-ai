#!/bin/bash

# Render build script for frontend
echo "🏥 Building Smart Health Frontend for Render..."

# Install dependencies
npm ci

# Build the application
npm run build

echo "✅ Frontend build complete!"