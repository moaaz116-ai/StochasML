from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

@dataclass
class Sample:
    id: str
    dataset_id: str
    filename: str
    label: str
    size: int
    data_reference: str
    metadata: dict = field(default_factory=dict)
    duration_ms: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    split: str = 'train'  # 'train' or 'test'
    is_disabled: bool = False
    created_at: datetime = field(default_factory=datetime.now)
