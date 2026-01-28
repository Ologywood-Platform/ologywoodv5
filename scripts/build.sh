#!/bin/bash
set -e

echo "=== Ologywood Build Script ==="
echo "Current directory: $(pwd)"
echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"
echo "pnpm version: $(pnpm --version)"

echo ""
echo "Step 1: Installing dependencies..."
pnpm install --frozen-lockfile

echo ""
echo "Step 2: Building application..."
pnpm build

echo ""
echo "Step 3: Verifying build output..."
if [ -f "dist/public/index.html" ]; then
  echo "✓ dist/public/index.html exists"
  echo "✓ File size: $(du -h dist/public/index.html | cut -f1)"
else
  echo "✗ ERROR: dist/public/index.html not found!"
  echo "Available files in dist/:"
  ls -la dist/ || echo "dist/ directory not found"
  exit 1
fi

if [ -f "dist/index.js" ]; then
  echo "✓ dist/index.js exists"
  echo "✓ File size: $(du -h dist/index.js | cut -f1)"
else
  echo "✗ ERROR: dist/index.js not found!"
  exit 1
fi

echo ""
echo "=== Build completed successfully ==="
