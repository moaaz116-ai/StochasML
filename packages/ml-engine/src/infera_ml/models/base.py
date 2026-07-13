from abc import ABC, abstractmethod
from typing import Any

class ModelBuilder(ABC):
    @abstractmethod
    def build(self, input_shape: tuple, num_classes: int) -> Any:
        pass

    @abstractmethod
    def get_recommended_hyperparams(self) -> dict:
        pass

    @abstractmethod
    def estimate_resources(self, input_shape: tuple, num_classes: int) -> dict:
        """Estimate Flash, RAM, and Arena sizes needed for this model"""
        pass
