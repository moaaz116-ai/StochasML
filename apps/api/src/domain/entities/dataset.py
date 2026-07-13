from enum import Enum
from dataclasses import dataclass
from datetime import datetime
from typing import List

class DataType(str, Enum):
    AUDIO = "audio"
    IMAGE = "image"
    SENSOR = "sensor"
    CUSTOM = "custom"

@dataclass
class Label:
    name: str
    color: str

@dataclass
class Dataset:
    id: str
    project_id: str
    name: str
    description: str
    data_type: DataType
    schema_version: str
    sample_count: int
    label_count: int
    total_size_bytes: int
    storage_url: str
    created_at: datetime
    updated_at: datetime
    labels: List[Label]
