from abc import ABC, abstractmethod
import numpy as np

class FeatureExtractor(ABC):
    @abstractmethod
    def get_feature_names(self) -> list[str]:
        pass

    @abstractmethod
    def get_output_shape(self) -> tuple:
        pass

    @abstractmethod
    def extract(self, data: np.ndarray) -> np.ndarray:
        pass
        
    @abstractmethod
    def generate_c_code(self) -> str:
        """Returns the equivalent C/C++ code implementation for the microcontroller"""
        pass
