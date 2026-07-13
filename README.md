# Stochas ML: Open-Source Applied TinyML & Edge AI Platform

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![CI/CD Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](.github/workflows/ci.yml)
[![Docker Support](https://img.shields.io/badge/docker-ready-blue.svg)](DEPLOYMENT_GUIDE.md)

**Stochas ML** is an end-to-end, production-ready TinyML platform that allows developers, embedded engineers, and domain researchers to collect sensor telemetry, train optimized neural network architectures, quantize to INT8, and generate ready-to-flash C++ firmware bundles directly onto microcontrollers (such as ESP32-S3 and ARM Cortex-M).

---

## Key Capabilities

- **Liquid Glass Interactive UI**: A stunning, hardware-accelerated dark theme dashboard built with Next.js 15, Tailwind CSS v4, and EB Garamond editorial typography.
- **Direct Web Serial Telemetry**: Stream live accelerometer, audio, or vibration data directly from your microcontroller to the browser using a custom COBS + CRC-8 + TLV zero-data-loss binary protocol.
- **End-to-End ML Pipeline**:
  - Automated signal cleaning, windowing, and normalization.
  - Spectral & statistical feature extraction (RMS, ZCR, Skewness, Kurtosis, FFT energy).
  - Configurable `Dense` and `1D CNN` neural network architectures.
  - Representative dataset INT8 Post-Training Quantization (TFLite Micro).
- **One-Click C++ Deployment Bundle**: Automatically compiles your trained weights and DSP pipeline into an isolated C++ `PlatformIO` / Arduino library package ready for flashing.
- **Local-First & Cloud Ready**: Runs completely self-contained offline on embedded workstations or deployed to enterprise cloud containers.

---

## Quickstart (Single Command with Docker Compose)

The fastest way to run Stochas ML with persistent storage is using **Docker Compose**:

```bash
# 1. Copy production environment configuration
cp .env.example .env

# 2. Launch frontend and backend containers
docker compose up -d --build
```

- **Frontend Application**: `http://localhost:3000`
- **FastAPI Backend & Swagger Docs**: `http://localhost:8000/docs`

---

## Manual / Local Development Setup

### Prerequisites
- **Node.js** 22+ & **pnpm** 10+
- **Python** 3.12+

### 1. Install Dependencies
```bash
# Enable pnpm and install web packages
corepack enable pnpm
pnpm install

# Create Python virtual environment and install ML Engine packages
python -m venv .venv
# On Windows PowerShell: .\.venv\Scripts\Activate.ps1
# On macOS / Linux: source .venv/bin/activate
pip install -e ./packages/ml-engine -e ./apps/api
```

### 2. Start Concurrent Development Server
```bash
pnpm dev
```

---

## Quickstart & Cloud Deployment Guides

Stochas ML includes dedicated, step-by-step deployment handbooks for any environment:

1. **[No-Credit-Card Free Cloud Deployment Guide](FREE_NO_CARD_DEPLOYMENT_GUIDE.md)**: Deploy the complete stack for free ($0/month) using **Hugging Face Spaces** (16 GB RAM, no Visa/card required) + **Vercel**.
2. **[Beginners Cloud Deployment Handbook](BEGINNERS_CLOUD_DEPLOYMENT_GUIDE.md)**: Click-by-click cloud guide for Vercel + Render.
3. **[Comprehensive Production Guide](DEPLOYMENT_GUIDE.md)**: Docker Compose, GitHub Actions CI/CD, and server administration.

---

## Environment Variables

See [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md) and [`.env.example`](.env.example) for the full list of production environment variables.

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api/v1` | Public API endpoint for frontend requests |
| `NEXT_PUBLIC_APP_NAME` | `Stochas ML` | Application display title |
| `API_HOST` / `API_PORT` | `0.0.0.0:8000` | FastAPI server binding configuration |
| `DATABASE_URL` | `sqlite:///./data/stochas_ml.db` | SQLite or PostgreSQL connection string |
| `STORAGE_DIR` | `./data/artifacts` | Persistent file storage for model artifacts |
| `SMTP_HOST` / `SMTP_USER` | Configurable | SMTP settings for email verification & password reset |

---

## Testing & Verification

Run automated tests across frontend and backend:

```bash
# Run frontend unit tests (Vitest)
pnpm --filter @infera/web test

# Run backend API & ML Engine unit tests (Pytest)
pytest
```

---

## License & Support

Distributed under the **Apache-2.0 License**. See `LICENSE` for more information.

For direct engineering inquiries or support:
- **Lead Developer**: Moaz Abdellatif
- **Phone / WhatsApp**: `+201096264652`
- **Email**: `moaz.abdellatif2009@gmail.com`
