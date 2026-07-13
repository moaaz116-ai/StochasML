import requests
import time
import json

def verify_e2e():
    print("--- 6. End-to-End Pipeline Verification ---")
    
    BASE_URL = "http://localhost:8000/api"
    project_id = "test-e2e-project"
    
    try:
        # Check if API is up
        requests.get("http://localhost:8000/health", timeout=2)
    except:
        print("API is not running. Please start it with 'uvicorn apps.api.src.main:app --port 8000'")
        return
        
    print("API is alive. Creating Dataset...")
    
    # 1. Create Dataset
    ds_payload = {
        "project_id": project_id,
        "name": "E2E Test Data",
        "data_type": "sensor",
        "labels": [{"name": "classA", "color": "#000"}]
    }
    r = requests.post(f"{BASE_URL}/datasets/", json=ds_payload)
    assert r.status_code == 200, f"Failed to create dataset: {r.text}"
    dataset_id = r.json()["id"]
    print(f"Dataset created: {dataset_id}")
    
    # 2. Upload Sample
    print("Uploading sample...")
    sample_data = [{"timestamp": i, "accel_x": i*0.1} for i in range(10)]
    files = {"file": ("data.json", json.dumps(sample_data), "application/json")}
    data = {"label": "classA"}
    r = requests.post(f"{BASE_URL}/datasets/{dataset_id}/samples", files=files, data=data)
    assert r.status_code == 200, f"Failed to upload sample: {r.text}"
    print("Sample uploaded successfully.")
    
    # 3. Train Model
    print("Triggering training pipeline...")
    train_payload = {"architecture": "dense", "epochs": 1}
    r = requests.post(f"{BASE_URL}/training/{project_id}/train", json=train_payload)
    assert r.status_code == 200, f"Failed to start training: {r.text}"
    experiment_id = r.json()["experiment_id"]
    print(f"Training started: {experiment_id}")
    
    # 4. Poll Status
    print("Polling training status...")
    status = "queued"
    while status in ["queued", "running"]:
        time.sleep(1)
        r = requests.get(f"{BASE_URL}/training/{experiment_id}/status")
        status = r.json()["status"]
        print(f"Status: {status}")
        
    assert status == "completed", f"Training did not complete successfully. Status: {status}"
    print("E2E Pipeline verified successfully! ✓")

if __name__ == "__main__":
    verify_e2e()
