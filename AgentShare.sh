#!/bin/bash

# AgentShare Universal Deployment Tool
# Node.js TUI Version

set -e

# Ensure Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required but not installed."
    exit 1
fi

# Ensure npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is required but not installed."
    exit 1
fi

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"

# Check if dependencies are installed
if [ ! -d "$REPO_ROOT/node_modules" ]; then
    echo "Installing dependencies..."
    cd "$REPO_ROOT" && npm install
fi

# Check if build exists, if not build it
if [ ! -f "$REPO_ROOT/dist/index.js" ]; then
    echo "Building TUI..."
    cd "$REPO_ROOT" && npm run build
fi

# Launch the app
cd "$REPO_ROOT" && npm start
