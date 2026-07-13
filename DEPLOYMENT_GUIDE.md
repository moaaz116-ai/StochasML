# Stochas ML — Comprehensive Production & Cloud Deployment Guide

Stochas ML is designed to be deployed cleanly and reliably with minimal backend or DevOps experience required. Whether running locally on your workstation, on an on-premise edge server, or deployed to cloud platforms (Vercel + Docker container hosting), follow this guide for zero-friction launch.

---

## 1. Single-Command Production Deployment (Docker Compose)

The fastest and most reliable way to run the entire Stochas ML stack (Next.js 15 Frontend + FastAPI ML Engine Backend + Persistent SQLite & Artifact Storage) is using **Docker Compose**.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### Step-by-Step Launch

1. **Clone or Download the Repository**:
   ```bash
   git clone https://github.com/yourusername/stochas-ml.git
   cd stochas-ml
   ```

2. **Copy Environment Configuration**:
   ```bash
   # On Linux / macOS / Git Bash:
   cp .env.example .env

   # On Windows PowerShell:
   Copy-Item .env.example .env
   ```

3. **Start Production Containers**:
   ```bash
   docker compose up -d --build
   ```

4. **Access Your Platform**:
   - **Frontend Application**: Reachable at `http://localhost:3000`
   - **Backend API Docs & OpenAPI**: Reachable at `http://localhost:8000/docs`
   - **Health Endpoint**: `http://localhost:8000/api/v1/health`

### Persistent Volumes
Your database and trained model artifacts are automatically persisted in Docker named volumes:
- `stochas_db`: Stores `stochas_ml.db` SQLite database (`/app/data/db`).
- `stochas_artifacts`: Stores uploaded datasets, trained TFLite models, and compiled C++ firmware packages (`/app/data/artifacts`).

---

## 2. Cloud Deployment (Vercel Frontend + Render/Railway/Docker Backend)

If you wish to host Stochas ML publicly on the web:

### Step 1: Deploy Backend ML Engine (Render / Railway / AWS ECS)
1. Connect your GitHub repository to [Render](https://render.com) or [Railway](https://railway.app).
2. Select **Dockerfile Deployment** and point to `apps/api/Dockerfile`.
3. Set Environment Variables:
   - `CORS_ORIGINS`: Your Vercel frontend URL (e.g., `https://stochas-ml.vercel.app`)
   - `STORAGE_DIR`: `/app/data/artifacts` (mount a persistent volume if deploying on Render Disk or AWS EFS).

### Step 2: Deploy Frontend Application (Vercel)
1. Import your GitHub repository into [Vercel](https://vercel.com).
2. Set Root Directory to `apps/web`.
3. Set Environment Variables in Vercel Project Settings:
   - `NEXT_PUBLIC_API_URL`: Your deployed backend API URL (e.g., `https://api.stochasml.com/api/v1`)
   - `NEXT_PUBLIC_APP_NAME`: `Stochas ML`
4. Click **Deploy**.

---

## 3. Automated CI/CD Pipeline (GitHub Actions)

Stochas ML includes two built-in GitHub Actions workflows in `.github/workflows/`:
1. **`ci.yml`**: Automatically runs on every `push` and `pull_request` to `main`:
   - Executes unit tests across `@infera/web` (Vitest) and backend ML Engine (`pytest`).
   - Verifies clean Next.js static generation and compilation.
2. **`deploy.yml`**: Builds and pushes production-grade multi-arch Docker images (`stochas-api:latest` and `stochas-web:latest`) directly to **GitHub Container Registry (`ghcr.io`)** on push to `main`.

---

## 4. End-to-End User Verification Workflow

To verify that your installation is 100% operational:

1. **User Identity & Profile**:
   - Open `http://localhost:3000/settings`.
   - Verify that API Server status displays **"Real TensorFlow"** (`status: online, mode: production`).
   - Set your **Profile Name** and **Email** and click **Save Preferences**.

2. **Create a TinyML Project**:
   - Navigate to **Projects** (`/projects`) → Click **Create Project**.
   - Enter Project Name: `Vibration Defect Classifier`, Target: `ESP32-S3`, Channels: `3` (`accel_x, accel_y, accel_z`).

3. **Record / Add Dataset**:
   - Navigate to **Datasets** (`/datasets`) → Click **Add Dataset**.
   - Generate synthetic accelerometer data or upload a CSV file with `3` columns matching the target channels.

4. **Train Neural Network Model**:
   - Navigate to **Training** (`/training`) → Click **Start Training**.
   - Watch real-time epoch training progress, validation accuracy curves, and automated INT8 quantization.

5. **Download Firmware Package**:
   - Navigate to **Deployments** (`/deployments`) → Select your trained model → Click **Generate Deployment Package**.
   - Download the C++ `PlatformIO` ZIP bundle ready to flash directly onto your ESP32-S3 microcontroller.
