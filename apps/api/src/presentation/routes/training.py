from fastapi import APIRouter, WebSocket, WebSocketDisconnect, BackgroundTasks, HTTPException
from typing import Dict
from src.domain.entities.experiment import Experiment, ExperimentStatus
from src.infrastructure.training.background_training_service import BackgroundTrainingService
import uuid

router = APIRouter()
training_service = BackgroundTrainingService()

# Active websocket connections for training progress
active_connections: Dict[str, WebSocket] = {}

@router.post("/{project_id}/train", summary="Start a new training job", description="Enqueues a new background training experiment for the specified project.")
async def start_training(project_id: str, config: dict):
    experiment_id = str(uuid.uuid4())
    experiment = Experiment(
        id=experiment_id,
        project_id=project_id,
        name=f"Run {experiment_id[:8]}",
        status=ExperimentStatus.QUEUED,
        architecture=config.get("architecture", "dense"),
        config=config
    )
    
    await training_service.submit_job(experiment)
    return {"experiment_id": experiment_id, "status": "queued"}

@router.get("/{experiment_id}/status", summary="Get training status", description="Returns the current status of an ongoing or completed training experiment.")
async def get_training_status(experiment_id: str):
    try:
        from src.config import settings
        status_info = await training_service.get_status(experiment_id)
        return {
            "experiment_id": experiment_id, 
            "status": status_info["status"],
            "metrics": status_info.get("metrics"),
            "logs": status_info.get("logs", []),
            "execution_mode": settings.ml_execution_mode
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{experiment_id}/cancel", summary="Cancel training job", description="Attempts to cancel a queued or running training job.")
async def cancel_training(experiment_id: str):
    success = await training_service.cancel_job(experiment_id)
    if not success:
        raise HTTPException(status_code=400, detail="Could not cancel job")
    return {"experiment_id": experiment_id, "status": "cancelled"}

@router.websocket("/{experiment_id}/ws")
async def training_websocket(websocket: WebSocket, experiment_id: str):
    """
    WebSocket endpoint for real-time training progress updates.
    """
    await websocket.accept()
    active_connections[experiment_id] = websocket
    try:
        while True:
            # Keep connection alive, wait for client messages if any
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        if experiment_id in active_connections:
            del active_connections[experiment_id]
