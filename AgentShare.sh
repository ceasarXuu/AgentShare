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
ORIGINAL_CWD="$(pwd)"
export AGENTSHARE_PROJECT_ROOT="$ORIGINAL_CWD"

# Check if dependencies are installed
if [ ! -d "$REPO_ROOT/node_modules" ]; then
    echo "Installing dependencies..."
    cd "$REPO_ROOT" && npm install
fi

# Check if build exists, if not build it
BUILD_OUTPUT="$REPO_ROOT/dist/index.js"
NEEDS_BUILD=false

if [ ! -f "$BUILD_OUTPUT" ]; then
    NEEDS_BUILD=true
elif [ "$REPO_ROOT/index.js" -nt "$BUILD_OUTPUT" ] || [ "$REPO_ROOT/logic.js" -nt "$BUILD_OUTPUT" ]; then
    NEEDS_BUILD=true
elif [ -d "$REPO_ROOT/schemas" ]; then
    NEWER_SCHEMA_FILE="$(find "$REPO_ROOT/schemas" -type f \( -name '*.yaml' -o -name '*.yml' \) -newer "$BUILD_OUTPUT" | head -n 1)"
    if [ -n "$NEWER_SCHEMA_FILE" ]; then
        NEEDS_BUILD=true
    fi
fi

if [ "$NEEDS_BUILD" = true ]; then
    echo "Building TUI..."
    cd "$REPO_ROOT" && npm run build
fi

# Launch the app
cd "$REPO_ROOT" && npm start
