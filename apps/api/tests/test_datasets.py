import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_create_dataset():
    response = client.post("/api/v1/datasets/", json={
        "project_id": "test-project-1",
        "name": "Walking Data",
        "description": "Accelerometer data for walking",
        "data_type": "sensor",
        "labels": [{"name": "walking", "color": "#ff0000"}]
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Walking Data"
    assert "id" in data
    assert data["label_count"] == 1

def test_list_datasets():
    # First create
    client.post("/api/v1/datasets/", json={
        "project_id": "proj-xyz",
        "name": "Test Data",
        "data_type": "sensor",
        "labels": []
    })
    
    # Then list
    response = client.get("/api/v1/datasets/proj-xyz/datasets")
    assert response.status_code == 200
    assert len(response.json()) >= 1
