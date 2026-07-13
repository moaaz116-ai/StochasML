from abc import ABC, abstractmethod
from src.domain.entities.experiment import Experiment, ExperimentStatus

class TrainingService(ABC):
    @abstractmethod
    async def submit_job(self, experiment: Experiment) -> str:
        pass

    @abstractmethod
    async def get_status(self, job_id: str) -> ExperimentStatus:
        pass

    @abstractmethod
    async def cancel_job(self, job_id: str) -> bool:
        pass
