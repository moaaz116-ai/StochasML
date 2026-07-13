from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from src.domain.entities.dataset import DataType

class LabelSchema(BaseModel):
    name: str
    color: str

class CreateDatasetDTO(BaseModel):
    project_id: str
    name: str = Field(..., min_length=1, max_length=100)
    description: str = ""
    data_type: DataType = DataType.SENSOR
    labels: list[LabelSchema] = []

class DatasetResponseDTO(BaseModel):
    id: str
    project_id: str
    name: str
    description: str
    data_type: DataType
    sample_count: int
    label_count: int
    total_size_bytes: int
    created_at: datetime
    updated_at: datetime
    labels: list[LabelSchema]

class CreateSampleDTO(BaseModel):
    dataset_id: str
    label: str
    metadata: dict = {}
