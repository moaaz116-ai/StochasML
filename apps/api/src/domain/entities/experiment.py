from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

class ExperimentStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

@dataclass
class Experiment:
    id: str
    project_id: str
    name: str
    status: ExperimentStatus
    architecture: str
    config: dict
    metrics: dict = field(default_factory=dict)
    logs: list = field(default_factory=list)
    reproducibility_meta: dict = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)
    completed_at: datetime | None = None
