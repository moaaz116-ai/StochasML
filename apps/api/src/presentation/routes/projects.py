import uuid
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

router = APIRouter()

from src.infrastructure.store import _projects

@router.post("/")
async def create_project(project_in: Dict[str, Any]):
    new_id = str(uuid.uuid4())
    new_project = {"id": new_id, **project_in}
    _projects[new_id] = new_project
    return new_project

@router.get("/")
async def list_projects():
    return list(_projects.values())

@router.get("/{project_id}")
async def get_project(project_id: str):
    if project_id not in _projects:
        from src.domain.exceptions import NotFoundException
        raise NotFoundException(entity="Project", entity_id=project_id)
    return _projects[project_id]

@router.put("/{project_id}")
async def update_project(project_id: str, project_in: Dict[str, Any]):
    if project_id not in _projects:
        raise HTTPException(status_code=404, detail="Project not found")
    _projects[project_id].update(project_in)
    return _projects[project_id]

@router.delete("/{project_id}")
async def delete_project(project_id: str):
    if project_id not in _projects:
        raise HTTPException(status_code=404, detail="Project not found")
    del _projects[project_id]
    return {"status": "success", "message": f"Project {project_id} deleted"}

