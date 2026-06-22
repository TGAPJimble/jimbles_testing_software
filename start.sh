#!/bin/bash
set -e

if [ ! -f "dist/index.html" ]; then
    echo "Installing dependencies..."
    npm install
    echo "Building app..."
    npm run build
else
    echo "Production build found! Bypassing node_modules installation..."
fi

echo "Starting server..."
NODE_ENV=production node server.js
