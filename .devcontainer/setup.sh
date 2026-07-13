#!/usr/bin/env bash
set -e

echo "=== Stochas ML — Automatic Cloud Environment Setup ==="

# 1. Enable pnpm & install Node dependencies
corepack enable pnpm
pnpm install

# 2. Install Python packages for ML Engine & API
pip install --upgrade pip hatch
pip install -e ./packages/ml-engine[tf]
pip install -e ./apps/api

# 3. Configure public Codespace URLs if running inside GitHub Codespaces
if [ -n "$CODESPACE_NAME" ]; then
  API_URL="https://${CODESPACE_NAME}-8000.app.github.dev/api/v1"
  echo "Configuring public GitHub Codespace URL: ${API_URL}"
  
  cat <<EOF > apps/web/.env.local
NEXT_PUBLIC_API_URL=${API_URL}
NEXT_PUBLIC_APP_NAME="Stochas ML"
EOF

  cat <<EOF > apps/api/.env
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=*
DATABASE_URL=sqlite:///./data/db/stochas_ml.db
STORAGE_DIR=./data/artifacts
EOF
fi

# Ensure data directories exist
mkdir -p data/db data/artifacts

echo "=== Stochas ML setup successfully completed! ==="
echo "Type 'pnpm dev' to start both Frontend and Backend concurrently."
