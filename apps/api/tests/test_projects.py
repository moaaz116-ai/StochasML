from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_create_project():
    response = client.post("/api/v1/projects/", json={
        "name": "ESP32 IMU Sandbox",
        "description": "Accelerometer model",
        "type": "CLASSIFICATION",
        "target_hardware": "esp32-s3"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "ESP32 IMU Sandbox"
    assert "id" in data

def test_list_projects():
    response = client.get("/api/v1/projects/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_project_not_found():
    response = client.get("/api/v1/projects/invalid-id")
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
