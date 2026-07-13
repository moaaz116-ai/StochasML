# ==============================================================================
# Root Dockerfile for Hugging Face Spaces & Zero-Card Free Cloud Hosting
# Builds and runs the Stochas ML FastAPI Backend & ML Engine
# Hugging Face Spaces Free Tier: 2 vCPU, 16 GB RAM, $0/month, NO CREDIT CARD
# ==============================================================================
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies required for C++ code generation and ML packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy ML Engine and API source code
COPY packages/ml-engine /app/packages/ml-engine
COPY apps/api /app/apps/api

# Install ML engine and API packages
RUN pip install --no-cache-dir --upgrade pip hatch
RUN pip install --no-cache-dir -e /app/packages/ml-engine[tf]
WORKDIR /app/apps/api
RUN pip install --no-cache-dir -e .

# Create persistent storage directories
RUN mkdir -p /app/data/db /app/data/artifacts
ENV DATABASE_URL="sqlite:////app/data/db/stochas_ml.db"
ENV STORAGE_DIR="/app/data/artifacts"
ENV CORS_ORIGINS="*"

# Hugging Face Spaces routes web traffic to port 7860 by default
EXPOSE 7860

# Run Uvicorn listening on port 7860 (or $PORT if overridden)
CMD ["sh", "-c", "uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
