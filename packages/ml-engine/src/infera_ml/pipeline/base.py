from dataclasses import dataclass
from typing import Any

@dataclass
class PipelineContext:
    data: Any = None
    labels: Any = None
    metadata: dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}

class PipelineError(Exception):
    pass

class PipelineStage:
    @property
    def name(self) -> str:
        return self.__class__.__name__

    def execute(self, context: PipelineContext) -> PipelineContext:
        raise NotImplementedError
        
    def validate_input(self, context: PipelineContext) -> None:
        pass
