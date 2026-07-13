# Stochas ML — Zero-Card Cloud Deployment Handbook (No Visa / Credit Card & No Docker Required)

If you do not have a Visa or credit card, or if your Hugging Face account does not have access to free Docker Spaces, follow this guide. You will deploy **Stochas ML** using **100% Free Tiers that never ask for a credit card and run pure Python without Docker**.

---

## The Best No-Credit-Card & No-Docker Cloud Stack

We use two generous free platforms that only require an email address or GitHub account:

1. **Backend ML Engine**: Hosted on **Hugging Face Spaces (Gradio / Python SDK — No Docker Required)**
   - **No Credit Card / Visa Required**.
   - **Free Specs**: 2 vCPUs, **16 GB RAM**, 50 GB Storage ($0/month forever).
   - *How it works*: Hugging Face automatically reads our root `requirements.txt` and launches `app.py`. No Docker container needed!
2. **Frontend Web Dashboard**: Hosted on **Vercel.com**
   - **No Credit Card / Visa Required**.
   - **Free Specs**: Global Edge Network ($0/month forever).

---

## Phase 1: Accounts Needed (Zero Payment Details)

1. **Hugging Face** ([https://huggingface.co/join](https://huggingface.co/join)): Create a free account with your email and password.
2. **Vercel** ([https://vercel.com](https://vercel.com)): Sign up for free using GitHub or Email.
3. **GitHub** ([https://github.com](https://github.com)): For storing your project source code.

---

## Phase 2: Click-by-Click Deployment Walkthrough

### Step 1: Deploy the Backend ML Engine on Hugging Face Spaces (~3 Minutes)

1. Go to [https://huggingface.co/new-space](https://huggingface.co/new-space) and sign in.
2. Fill in the **Create a new Space** form exactly:
   - **Space name**: `stochas-ml-backend`
   - **License**: `apache-2.0`
   - **Select the Space SDK**: Click **Gradio** *(Important: Choose Gradio so it runs pure Python without Docker)*
   - **Choose a template**: Select **Blank**
   - **Space Hardware**: Keep default **FREE CPU Basic · 2 vCPU · 16GB · Free**
3. Click **Create Space**.
4. Open PowerShell inside your `Infera` project folder (`C:\Users\MF\Desktop\Infera`) and push your code directly to your new Hugging Face Space:
   ```powershell
   git remote add hf https://huggingface.co/spaces/YOUR_HF_USERNAME/stochas-ml-backend
   git push hf main
   ```
   *(Replace `YOUR_HF_USERNAME` with your Hugging Face username).*
   - **Note on Login**: When Git asks for your Hugging Face password, use a free **Hugging Face Access Token** created at [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens).
5. Within ~2 minutes, Hugging Face will automatically install `requirements.txt`, run `app.py`, and show **Running** in green!
6. Your backend API URL will be:
   `https://YOUR_HF_USERNAME-stochas-ml-backend.hf.space`
   - *Copy this URL! You will paste it into Vercel in Step 2.*

---

### Step 2: Deploy the Frontend Dashboard on Vercel (~2 Minutes)

1. First, push your project to GitHub if you haven't already:
   ```powershell
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/stochas-ml.git
   git push -u origin main
   ```
2. Go to [https://vercel.com/new](https://vercel.com/new) and click **Import** next to `stochas-ml`.
3. Next to **Root Directory**, click **Edit** → select `apps/web` → click **Continue**.
4. Expand **Environment Variables** and add:

   | Key | Value | Explanation |
   | :--- | :--- | :--- |
   | `NEXT_PUBLIC_API_URL` | `https://YOUR_HF_USERNAME-stochas-ml-backend.hf.space/api/v1` | Paste your Hugging Face backend URL and add `/api/v1` at the end! |
   | `NEXT_PUBLIC_APP_NAME` | `Stochas ML` | Application title |

5. Click **Deploy**. When Vercel finishes (~60 seconds), click **Visit** to open your live production platform!

---

## Launch Checklist

- [ ] **1. Hugging Face Space Created**: Space created with SDK **Gradio** (Python) and `FREE CPU Basic (16GB)` hardware.
- [ ] **2. Code Pushed to Hugging Face**: Run `git push hf main` and confirm Space status displays **Running** in green.
- [ ] **3. Vercel Dashboard Live**: Imported `apps/web` with `NEXT_PUBLIC_API_URL` set to `https://<username>-stochas-ml-backend.hf.space/api/v1`.
- [ ] **4. End-to-End Verification**: Open live Vercel URL → Settings → verify API status reads **"Real TensorFlow"**.
