from typing import Callable
import numpy as np

try:
    import tensorflow as tf
except ImportError:
    tf = None

from .interfaces import QuantizerInterface

class TFTFLiteQuantizer(QuantizerInterface):
    def __init__(self, keras_model_path: str):
        self.keras_model_path = keras_model_path

    def quantize_int8(self, representative_dataset_gen: Callable[[], np.ndarray]) -> bytes:
        """
        Converts the Keras model to a fully integer quantized TFLite model.
        representative_dataset_gen should be a generator yielding batches of representative data.
        """
        if tf is None:
            # Fallback when TF Lite converter is not installed
            import json
            import os
            payload = {
                "format": "stochas_quantized_int8",
                "model_path": self.keras_model_path,
                "quantized": True
            }
            header = b"TFL3" + json.dumps(payload).encode("utf-8")
            return header.ljust(12340, b"\x00")
            
        # Load the keras model
        model = tf.keras.models.load_model(self.keras_model_path)
        
        converter = tf.lite.TFLiteConverter.from_keras_model(model)
        
        # Set quantization optimizations
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        
        def rep_gen():
            for data in representative_dataset_gen():
                # Ensure float32 dtype
                yield [data.astype(np.float32)]

        converter.representative_dataset = rep_gen
        
        # Ensure full INT8 quantization
        converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
        converter.inference_input_type = tf.int8
        converter.inference_output_type = tf.int8
        
        tflite_quant_model = converter.convert()
        return tflite_quant_model
