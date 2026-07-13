from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import io
import os
import time
from typing import Dict, Any
from src.infrastructure.store import _deployments, _models, _projects
from infera_ml.codegen.model_header import generate_model_header
from infera_ml.codegen.main_cpp import generate_main_cpp
from infera_ml.codegen.platformio_ini import generate_platformio_ini
from infera_ml.codegen.bundler import create_deployment_bundle

router = APIRouter()

BOARD_SPECS = {
    "esp32-s3": {
        "name": "ESP32-S3",
        "target": "esp32-s3",
        "platformio": {
            "platform": "espressif32",
            "board": "esp32-s3-devkitc-1",
            "framework": "arduino",
            "build_flags": ["-D ESP32S3", "-O3"]
        }
    },
    "esp32": {
        "name": "ESP32",
        "target": "esp32",
        "platformio": {
            "platform": "espressif32",
            "board": "esp32dev",
            "framework": "arduino",
            "build_flags": ["-O3"]
        }
    },
    "arduino-nano-33": {
        "name": "Arduino Nano 33 BLE",
        "target": "nano33ble",
        "platformio": {
            "platform": "nordicnrf52",
            "board": "nano33ble",
            "framework": "arduino",
            "build_flags": ["-O3"]
        }
    },
    "raspberry-pi-pico": {
        "name": "Raspberry Pi Pico",
        "target": "pico",
        "platformio": {
            "platform": "raspberrypi",
            "board": "pico",
            "framework": "arduino",
            "build_flags": ["-O3"]
        }
    },
    "generic": {
        "name": "Generic C++",
        "target": "generic_cpp",
        "platformio": {
            "platform": "native",
            "board": "native",
            "framework": "",
            "build_flags": ["-std=c++11"]
        }
    }
}

def _get_deployment_files(deployment_id: str) -> Dict[str, str | bytes]:
    if deployment_id not in _deployments:
        raise HTTPException(status_code=404, detail="Deployment not found")
        
    deployment = _deployments[deployment_id]
    model_id = deployment.get("modelId")
    project_id = deployment.get("projectId")
    target_board = deployment.get("target", "esp32-s3")
    
    # Resolve project metadata
    sensor_channels = 3
    num_features = 15
    num_classes = 2
    
    if project_id and project_id in _projects:
        project = _projects[project_id]
        sensor_channels = project.get("channelCount", 3)
        # In a real pipeline, the impulse config determines features
        impulse = project.get("impulseConfig", {})
        if impulse:
            # Estimate features size or load from saved run
            num_features = len(impulse.get("axes", ["ax", "ay", "az"])) * 5
            
    # Resolve model metrics & classes
    if model_id and model_id in _models:
        model_info = _models[model_id]
        # In a real app we'd load classes count from the dataset associated with project
        pass

    # Read real .tflite bytes
    tflite_bytes = None
    if model_id:
        tflite_path = f"data/models/{model_id}.tflite"
        if os.path.exists(tflite_path):
            try:
                with open(tflite_path, "rb") as f:
                    tflite_bytes = f.read()
            except Exception:
                pass
                
    if not tflite_bytes:
        # If no real model file found, raise error - do not silently return mock bytes
        raise HTTPException(
            status_code=404,
            detail=(
                f"No trained .tflite artifact found for model '{model_id}'. "
                "Train the model first to generate a deployable firmware package."
            )
        )

    # Generate files dynamically
    header_content, source_content = generate_model_header(tflite_bytes, variable_name="g_model")
    main_cpp_content = generate_main_cpp(num_features=num_features, num_classes=num_classes, sensor_channels=sensor_channels)
    
    board_spec = BOARD_SPECS.get(target_board, BOARD_SPECS["esp32-s3"])
    platformio_ini_content = generate_platformio_ini(board_spec)
    
    return {
        "model.h": header_content,
        "model.cpp": source_content,
        "main.cpp": main_cpp_content,
        "platformio.ini": platformio_ini_content
    }

@router.get("/")
async def list_deployments(project_id: str = None):
    now = time.time()
    for d in _deployments.values():
        if "created_timestamp" not in d:
            d["created_timestamp"] = now
            
        elapsed = now - d["created_timestamp"]
        if d.get("status") == "pending" and elapsed > 2:
            d["status"] = "building"
        elif d.get("status") == "building" and elapsed > 6:
            d["status"] = "ready"
            
    if project_id:
        return [d for d in _deployments.values() if d.get("projectId") == project_id]
    return list(_deployments.values())

@router.post("/")
async def create_deployment(deployment: dict):
    deploy_id = deployment.get("id")
    if not deploy_id:
        import uuid
        deploy_id = str(uuid.uuid4())
        deployment["id"] = deploy_id
        
    deployment["status"] = "pending"
    deployment["firmwareUrl"] = f"/api/v1/deployments/{deploy_id}/download"
    deployment["created_timestamp"] = time.time()
    
    _deployments[deploy_id] = deployment
    return deployment

@router.get("/{deployment_id}/download")
async def download_firmware(deployment_id: str):
    files = _get_deployment_files(deployment_id)
    
    # Structure files properly for a PlatformIO project bundle
    structured_files = {
        "src/main.cpp": files["main.cpp"],
        "src/model.cpp": files["model.cpp"],
        "src/model.h": files["model.h"],
        "platformio.ini": files["platformio.ini"]
    }
    
    zip_bytes = create_deployment_bundle(structured_files)
    
    return StreamingResponse(
        io.BytesIO(zip_bytes),
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=firmware-{deployment_id[:8]}.zip"}
    )

@router.get("/{deployment_id}/files")
async def view_deployment_files(deployment_id: str):
    return _get_deployment_files(deployment_id)
