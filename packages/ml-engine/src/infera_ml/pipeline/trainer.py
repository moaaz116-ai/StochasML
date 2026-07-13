import os
import time
from typing import Dict, Any
import numpy as np

from .interfaces import TrainerInterface

class MockModelTrainer(TrainerInterface):
    def __init__(self, model_builder, hyperparams: dict):
        self.model_builder = model_builder
        self.hyperparams = hyperparams

    def train(self, X_train: np.ndarray, y_train: np.ndarray, X_val: np.ndarray, y_val: np.ndarray, num_classes: int) -> Dict[str, Any]:
        """Simulates training a Keras model and returns dummy metrics."""
        epochs = int(self.hyperparams.get("epochs", 10))
        
        # Simulate training time
        time.sleep(2)
        
        import tempfile
        temp_model_path = os.path.join(tempfile.gettempdir(), f"infera_model_{id(self)}.keras")
        with open(temp_model_path, 'w') as f:
            f.write("mock_keras_model_content")
        
        return {
            "model_path": temp_model_path,
            "metrics": {
                "accuracy": 0.945,
                "loss": 0.12,
                "val_accuracy": 0.932,
                "val_loss": 0.15
            }
        }
