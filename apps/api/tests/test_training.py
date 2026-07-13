from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_trigger_training():
    # Trigger an experiment run
    response = client.post("/api/v1/training/test-project/train", json={
        "project_id": "test-project",
        "dataset_ids": ["ds1", "ds2"],
        "architecture": "dense",
        "hyperparameters": {
            "learning_rate": 0.001,
            "epochs": 10,
            "batch_size": 32
        }
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "queued"
    assert "experiment_id" in data

def test_training_status_not_found():
    response = client.get("/api/v1/training/invalid-exp-id/status")
    assert response.status_code == 404
