from abc import ABC, abstractmethod
from typing import Dict, Any, Callable
import numpy as np

class TrainerInterface(ABC):
    @abstractmethod
    def train(self, X_train: np.ndarray, y_train: np.ndarray, X_val: np.ndarray, y_val: np.ndarray, num_classes: int) -> Dict[str, Any]:
        """
        Trains the model and returns a dictionary with the model path and metrics.
        Returns:
            Dict containing:
                - model_path: str (path to the saved keras model or dummy file)
                - metrics: Dict[str, float] (accuracy, loss, val_accuracy, val_loss)
        """
        pass

class QuantizerInterface(ABC):
    @abstractmethod
    def quantize_int8(self, representative_dataset_gen: Callable[[], np.ndarray]) -> bytes:
        """
        Quantizes the model to INT8 TFLite format.
        Returns:
            bytes: The quantized TFLite model data.
        """
        pass
