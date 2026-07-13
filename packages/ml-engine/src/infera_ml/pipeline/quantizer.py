import numpy as np
from typing import Callable

from .interfaces import QuantizerInterface

class MockTFLiteQuantizer(QuantizerInterface):
    def __init__(self, keras_model_path: str):
        self.keras_model_path = keras_model_path

    def quantize_int8(self, representative_dataset_gen: Callable[[], np.ndarray]) -> bytes:
        """
        Simulates converting the Keras model to a fully integer quantized TFLite model.
        """
        # Return a simulated tiny byte array (e.g., 40KB of dummy data)
        return bytes([0] * 40960)
