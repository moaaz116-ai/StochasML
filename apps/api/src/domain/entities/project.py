from dataclasses import dataclass
from datetime import datetime

@dataclass
class Project:
    id: str
    user_id: str
    name: str
    description: str
    board_type: str
    sampling_rate: int
    sensor_channels: list[str]
    created_at: datetime
    updated_at: datetime
