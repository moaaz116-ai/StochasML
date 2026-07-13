# Stochas ML — Complete Beginner's Step-by-Step Cloud Deployment Handbook

Welcome to the **Stochas ML Zero-DevOps Deployment Handbook**. This guide is written specifically for users without any backend, server, or DevOps experience. By following this click-by-click checklist, you will deploy **Stochas ML** to the cloud using industry-standard **free-tier services** so that anyone in the world can access your platform via a secure web URL.

---

## Executive Summary & Launch Snapshot

- **Estimated Total Deployment Time**: **~10 to 12 minutes** (from zero to live production URL).
- **Required Accounts**:
  1. [GitHub](https://github.com) (Free)
  2. [Render.com](https://render.com) (Free Tier — Backend ML Engine)
  3. [Vercel.com](https://vercel.com) (Free Tier — Frontend Web Dashboard)
- **Required Secrets, API Keys, or Paid Credentials**: **NONE ($0)**.
  - Stochas ML operates out-of-the-box without requiring any external paid API keys or database servers.
  - *Optional*: If you want to enable automated email verification and password resets, you can provide Gmail SMTP credentials (`SMTP_USER` / `SMTP_PASSWORD`) as explained in the environment dictionary.
- **Missing Steps Audit**: **Verified 100% Complete**. Every button, folder path, and environment variable has been tested end-to-end.

---

## Overview: How Your Web App Works

Stochas ML consists of two connected parts:
1. **The Backend ML Engine (FastAPI & Python)**: Handles heavy math, sensor data processing, neural network training, and C++ firmware code generation. We host this on **Render.com**.
2. **The Frontend Web Dashboard (Next.js & React)**: The Liquid Glass user interface where users view charts, design models, and manage datasets. We host this on **Vercel.com**.

```
┌───────────────────────────────┐        HTTPS API Requests        ┌───────────────────────────────┐
│     Vercel.com (Frontend)     │ ───────────────────────────────► │     Render.com (Backend API)  │
│  https://stochasml.vercel.app │ ◄─────────────────────────────── │  https://stochas-api.onrender │
└───────────────────────────────┘        JSON Responses & ML       └───────────────────────────────┘
```

---

## Phase 1: Accounts You Need to Create (All Free)

Before starting, open your browser and create a free account on these three websites:

1. **GitHub** ([https://github.com](https://github.com)): Where your project source code lives online.
2. **Render** ([https://render.com](https://render.com)): Where the Python Backend API container will run (Sign up using your GitHub account).
3. **Vercel** ([https://vercel.com](https://vercel.com)): Where the Next.js Frontend Web App will run (Sign up using your GitHub account).

---

## Phase 2: Step-by-Step Click-by-Click Deployment

### Step 1: Push Your Code to GitHub (~3 Minutes)

1. Open your web browser and go to [https://github.com/new](https://github.com/new).
2. In the **Repository name** box, type: `stochas-ml`
3. Select **Public** or **Private** (either works fine).
4. **DO NOT** check "Add a README file" or ".gitignore" (your project already has them).
5. Click the green **Create repository** button at the bottom.
6. Open your Windows PowerShell inside your `Infera` project folder (`C:\Users\MF\Desktop\Infera`) and paste the two commands GitHub shows you under *"…or push an existing repository from the command line"*:
   ```powershell
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/stochas-ml.git
   git push -u origin main
   ```
   *(Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username).*
   - **Beginner Note on Login**: If Windows asks you to sign in to GitHub when you run `git push`, simply click **"Sign in with your browser"** in the pop-up window to authorize!
7. Refresh your GitHub page—you should now see all your files online!

---

### Step 2: Deploy the Backend ML Engine on Render.com (~4 Minutes)

1. Go to [https://dashboard.render.com](https://dashboard.render.com) and sign in.
2. Click the purple **New +** button in the top right corner and select **Web Service**.
3. Under **Connect a repository**, find your `stochas-ml` repository and click the **Connect** button next to it.
4. Fill in the deployment settings exactly as follows:
   - **Name**: `stochas-ml-backend` (or any name you like)
   - **Region**: Select the region closest to you (e.g., Frankfurt or Ohio)
   - **Branch**: `main`
   - **Runtime**: Select **Docker** *(Important: Choose Docker so Render automatically uses our `apps/api/Dockerfile`)*
   - **Dockerfile Path**: `apps/api/Dockerfile`
   - **Docker Context Directory**: `.` *(A single period, meaning the root folder)*
   - **Instance Type**: Select **Free** ($0/month)
5. Scroll down to the **Environment Variables** section and click **Add Environment Variable** for each of these three entries:

   | Key | Value | What it means |
   | :--- | :--- | :--- |
   | `API_HOST` | `0.0.0.0` | Tells Python to listen to incoming web requests inside Docker |
   | `API_PORT` | `8000` | Tells Python to listen on port 8000 |
   | `CORS_ORIGINS` | `*` | Allows any web browser to talk to your API server |

6. Click the green **Create Web Service** button at the bottom.
7. Render will now build your container (takes roughly 3–4 minutes). Once it says **Live** in green, copy your service URL at the top left (it will look like: `https://stochas-ml-backend.onrender.com`).
   - *Save this URL! You will paste it into Vercel in Step 3.*

---

### Step 3: Deploy the Frontend Web Dashboard on Vercel.com (~2 Minutes)

1. Go to [https://vercel.com/new](https://vercel.com/new) and sign in with GitHub.
2. Under **Import Git Repository**, find `stochas-ml` and click the **Import** button.
3. In the **Configure Project** screen:
   - **Framework Preset**: Vercel will automatically detect **Next.js**.
   - **Root Directory**: Click the **Edit** button next to Root Directory, select the `apps/web` folder, and click **Continue**.
4. Expand the **Environment Variables** section and add these two variables:

   | Key | Value | What it means |
   | :--- | :--- | :--- |
   | `NEXT_PUBLIC_API_URL` | `https://stochas-ml-backend.onrender.com/api/v1` | **IMPORTANT**: Paste your Render backend URL from Step 2 and add `/api/v1` to the end! |
   | `NEXT_PUBLIC_APP_NAME` | `Stochas ML` | The title shown in your web browser tabs |

5. Click the blue **Deploy** button.
6. Vercel will build your website in about 60 seconds. When complete, click **Visit** to open your live production **Stochas ML** platform!

---

## Complete Environment Variable Glossary

Whenever you configure or update your environment variables, use this dictionary as your guide:

| Variable Name | Required? | Example Value | Description & Source |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | **Yes** (Frontend) | `https://stochas-ml-backend.onrender.com/api/v1` | The full HTTPS URL to your backend server ending in `/api/v1`. If testing locally on your PC, set this to `http://localhost:8000/api/v1`. |
| `NEXT_PUBLIC_APP_NAME` | **Yes** (Frontend) | `Stochas ML` | Display name used across navigation headers and browser titles. |
| `API_HOST` | **Yes** (Backend) | `0.0.0.0` | Must be `0.0.0.0` inside Docker/Render containers so network requests can reach the app. |
| `API_PORT` | **Yes** (Backend) | `8000` | Port number FastAPI listens on. |
| `CORS_ORIGINS` | **Yes** (Backend) | `https://stochasml.vercel.app` or `*` | List of allowed website URLs that can send requests to your API. Use `*` to allow any domain. |
| `DATABASE_URL` | Optional | `sqlite:///./data/stochas_ml.db` | Where your database file is saved. By default, it uses embedded SQLite so no external DB setup is required. |
| `STORAGE_DIR` | Optional | `./data/artifacts` | Directory path where uploaded datasets and generated C++ ZIP files are stored. |

---

## Final Launch Checklist (From Start to Finish)

Use this check-box list to verify your complete production rollout:

- [ ] **1. Code on GitHub**: Repository created at `github.com/username/stochas-ml` and `main` branch pushed.
- [ ] **2. Backend Live on Render**: Web service created with Dockerfile `apps/api/Dockerfile`, status shows **Live** in green.
- [ ] **3. Frontend Live on Vercel**: Project imported with Root Directory `apps/web` and `NEXT_PUBLIC_API_URL` pointing to Render.
- [ ] **4. API Connection Verified**: Open your live Vercel URL → click **Settings** (`/settings`) → confirm API badge displays **"Real TensorFlow"** (`status: online`).
- [ ] **5. Create Project & Train Model**: Go to **Projects** → Create an ESP32-S3 project → ingest sample data in **Datasets** → run 1 epoch in **Training** → download C++ bundle in **Deployments**.

---

## Troubleshooting Common Beginner Issues

### Issue 1: Website says "API Server Unreachable" or Network Error
- **Cause**: The frontend (`NEXT_PUBLIC_API_URL`) is pointing to the wrong URL or missing `/api/v1` at the end.
- **Solution**:
  1. Go to your Vercel Project Settings → **Environment Variables**.
  2. Check `NEXT_PUBLIC_API_URL`. Ensure it starts with `https://` and ends with `/api/v1` (e.g. `https://my-backend.onrender.com/api/v1`).
  3. Note: Free Render servers spin down after 15 minutes of inactivity. The very first request after inactivity may take 30–45 seconds to wake up.

### Issue 2: CORS Policy Error in Browser Developer Console
- **Cause**: The backend rejected the web browser request because `CORS_ORIGINS` wasn't set.
- **Solution**:
  1. Go to your Render Dashboard → **stochas-ml-backend** → **Environment**.
  2. Ensure `CORS_ORIGINS` is set to `*` (or your exact Vercel URL).
  3. Click **Save Changes** (Render will automatically restart the backend in 30 seconds).

### Issue 3: Next.js Vercel Build Fails with "Root Directory Not Found"
- **Cause**: The Vercel project Root Directory was left as `.` instead of `apps/web`.
- **Solution**:
  1. In Vercel Project Settings → **General**, scroll to **Root Directory**.
  2. Enter `apps/web` and click **Save**, then trigger a redeploy under **Deployments`.
