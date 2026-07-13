# Stochas ML — One-Click Free Cloud Launch via GitHub Codespaces (No Credit Card Required)

If you do not have a credit card or Visa card, or do not want to set up hosting accounts across multiple cloud providers, you can run the complete **Stochas ML** platform in the cloud using **GitHub Codespaces**.

Every free GitHub account includes **60 hours per month of free cloud machine hosting (4 CPU Cores, 8 GB RAM, 32 GB Storage) with zero payment details or credit card required**.

---

## Why GitHub Codespaces is the Best Zero-Card Demonstration Environment

1. **No Credit Card / Visa Required**: Only a free GitHub account is needed.
2. **Pre-configured Auto-Setup**: When you open the Codespace, our built-in `.devcontainer` script automatically installs Python 3.12, Node.js 22, TensorFlow Lite Micro, and configures secure HTTPS endpoints for both the frontend and backend.
3. **Public Shareable URL**: Anyone you share the live Codespace URL with can interact with your full Stochas ML platform from their browser.

---

## Step-by-Step 2-Minute Launch Walkthrough

### Step 1: Push Your Code to GitHub (~2 Minutes)

If your repository isn't on GitHub yet:
1. Open [https://github.com/new](https://github.com/new) and create a repository named `stochas-ml`.
2. Open PowerShell inside your project folder (`C:\Users\MF\Desktop\Infera`) and run:
   ```powershell
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/stochas-ml.git
   git push -u origin main
   ```

---

### Step 2: One-Click Launch in GitHub Codespaces (~90 Seconds)

1. Open your repository page on GitHub (`https://github.com/YOUR_GITHUB_USERNAME/stochas-ml`).
2. Click the green **<> Code** button near the top right of your files list.
3. Click the **Codespaces** tab inside the menu.
4. Click the green **Create codespace on main** button.
   *(A new browser tab will open showing a cloud VS Code editor while GitHub builds your container).*

---

### Step 3: Start the Application (~20 Seconds)

1. Once the Codespace opens, look at the terminal at the bottom of the screen.
2. Run this command to install the Python backend packages (`uvicorn`, `fastapi`, and ML Engine):
   ```bash
   pip install -r requirements.txt
   ```
   *(Or simply run `pnpm setup`)*
3. Now start both the frontend and backend servers concurrently:
   ```bash
   pnpm dev
   ```
4. A pop-up notification will appear at the bottom right saying:
   **"Your application running on port 3000 is available."**
5. Click the blue **Open in Browser** button (or check the **Ports** tab next to Terminal and click the globe icon next to Port 3000).

---

## Congratulations! Your Platform is Live!

You will see your fully interactive **Stochas ML Liquid Glass Dashboard** running live in your browser over secure HTTPS!

- **Frontend Dashboard**: `https://<YOUR-CODESPACE-NAME>-3000.app.github.dev`
- **Backend API & Swagger Docs**: `https://<YOUR-CODESPACE-NAME>-8000.app.github.dev/docs`

---

## Verification & Usage Checklist

Test your live cloud demonstration:
- [ ] **1. Server Health Check**: Open **Settings** (`/settings`) → verify API status displays **"Real TensorFlow"** in green.
- [ ] **2. Create Project**: Open **Projects** (`/projects`) → click **Create Project** (`ESP32-S3`).
- [ ] **3. Upload Dataset**: Open **Datasets** (`/datasets`) → add accelerometer sample telemetry.
- [ ] **4. Train Neural Network**: Open **Training** (`/training`) → run epoch training and inspect model metrics.
- [ ] **5. Download C++ Firmware**: Open **Deployments** (`/deployments`) → click **Generate Deployment Package** to download the `PlatformIO` C++ `.zip` archive.
