#!/bin/bash
set -euo pipefail

export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
fi

if command -v nvm >/dev/null 2>&1 && [ -f ".nvmrc" ]; then
  NODE_VERSION="$(cat .nvmrc)"
  nvm install "$NODE_VERSION"
  nvm use "$NODE_VERSION"
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not available. Install nvm or Node 20 first."
  exit 1
fi

(sleep 3 && open http://localhost:3000 >/dev/null 2>&1 || true) &
npm run dev
