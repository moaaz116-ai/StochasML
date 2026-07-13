from dataclasses import dataclass
from datetime import datetime
from enum import Enum

class ModelStatus(str, Enum):
    DRAFT = "draft"
    CANDIDATE = "candidate"
    PRODUCTION = "production"
    ARCHIVED = "archived"
    DEPRECATED = "deprecated"

@dataclass
class Model:
    id: str
    experiment_id: str
    project_id: str
    name: str
    version: str
    status: ModelStatus
    architecture: str
    accuracy: float
    size_bytes: int
    latency_ms: float
    artifact_urls: dict[str, str]
    created_at: datetime
    
    def promote(self) -> None:
        if self.status == ModelStatus.DRAFT:
            self.status = ModelStatus.CANDIDATE
        elif self.status == ModelStatus.CANDIDATE:
            self.status = ModelStatus.PRODUCTION
        else:
            raise ValueError(f"Cannot promote model from status {self.status}")
            
    def archive(self) -> None:
        self.status = ModelStatus.ARCHIVED
