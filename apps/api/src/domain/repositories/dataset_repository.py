from abc import ABC, abstractmethod
from typing import List, Optional
from src.domain.entities.dataset import Dataset

class DatasetRepository(ABC):
    @abstractmethod
    def save(self, dataset: Dataset) -> None:
        pass

    @abstractmethod
    def get_by_id(self, dataset_id: str) -> Optional[Dataset]:
        pass

    @abstractmethod
    def list_by_project(self, project_id: str) -> List[Dataset]:
        pass
