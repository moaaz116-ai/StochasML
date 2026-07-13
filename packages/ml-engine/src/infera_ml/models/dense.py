from .base import ModelBuilder
import tensorflow as tf

class DenseClassifier(ModelBuilder):
    def build(self, input_shape: tuple, num_classes: int) -> tf.keras.Model:
        model = tf.keras.Sequential([
            tf.keras.layers.InputLayer(input_shape=input_shape),
            tf.keras.layers.Dense(64, activation='relu'),
            tf.keras.layers.Dropout(0.3),
            tf.keras.layers.Dense(32, activation='relu'),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(num_classes, activation='softmax')
        ])
        return model

    def get_recommended_hyperparams(self) -> dict:
        return {
            'epochs': 50,
            'batch_size': 32,
            'learning_rate': 0.001,
            'optimizer': 'adam'
        }

    def estimate_resources(self, input_shape: tuple, num_classes: int) -> dict:
        # Very rough estimation based on params
        input_size = input_shape[0] if isinstance(input_shape, tuple) else input_shape
        params_layer1 = (input_size * 64) + 64
        params_layer2 = (64 * 32) + 32
        params_layer3 = (32 * num_classes) + num_classes
        total_params = params_layer1 + params_layer2 + params_layer3
        
        # Assume INT8 quantization (1 byte per weight) + overhead
        flash_bytes = total_params + 2048  # Flatbuffer overhead
        
        # RAM needed for activations
        ram_bytes = max(input_size, 64) * 4 # 4 bytes per float or 1 byte per int8 but keeping it safe
        arena_bytes = 4096 + ram_bytes + 1024 # tensor arena overhead
        
        return {
            'flash_bytes': flash_bytes,
            'ram_bytes': ram_bytes,
            'arena_bytes': arena_bytes,
            'latency_ms': 1.5 # ~1.5ms on ESP32-S3 for this small model
        }
