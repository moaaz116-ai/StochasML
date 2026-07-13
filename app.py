# ==============================================================================
# Root Entrypoint for Python Cloud Providers (No Docker Required)
# Compatible with Hugging Face Spaces (Gradio/Python SDK), Koyeb, Render Python,
# and any direct Python environment.
# ==============================================================================
import os
import sys

# Ensure apps/api and packages/ml-engine are in Python path
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(ROOT_DIR, "apps", "api"))
sys.path.insert(0, os.path.join(ROOT_DIR, "packages", "ml-engine", "src"))

# Create data directories if they don't exist
os.makedirs(os.path.join(ROOT_DIR, "data", "db"), exist_ok=True)
os.makedirs(os.path.join(ROOT_DIR, "data", "artifacts"), exist_ok=True)

# Set default environment variables if not already set
os.environ.setdefault("DATABASE_URL", f"sqlite:///{os.path.join(ROOT_DIR, 'data', 'db', 'stochas_ml.db')}")
os.environ.setdefault("STORAGE_DIR", os.path.join(ROOT_DIR, "data", "artifacts"))
os.environ.setdefault("CORS_ORIGINS", "*")

from src.main import app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
