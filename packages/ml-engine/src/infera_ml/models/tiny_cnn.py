from .base import ModelBuilder
import tensorflow as tf

class TinyCNN1D(ModelBuilder):
    def build(self, input_shape: tuple, num_classes: int) -> tf.keras.Model:
        model = tf.keras.Sequential([
            tf.keras.layers.InputLayer(input_shape=input_shape),
            # Expand dims if 2D input (batch, features) to (batch, steps, features)
            tf.keras.layers.Reshape((input_shape[0], 1)) if len(input_shape) == 1 else tf.keras.layers.Identity(),
            
            tf.keras.layers.Conv1D(filters=16, kernel_size=3, activation='relu', padding='same'),
            tf.keras.layers.MaxPooling1D(pool_size=2),
            tf.keras.layers.Dropout(0.1),
            
            tf.keras.layers.Conv1D(filters=32, kernel_size=3, activation='relu', padding='same'),
            tf.keras.layers.MaxPooling1D(pool_size=2),
            tf.keras.layers.Dropout(0.2),
            
            tf.keras.layers.Flatten(),
            tf.keras.layers.Dense(32, activation='relu'),
            tf.keras.layers.Dense(num_classes, activation='softmax')
        ])
        return model

    def get_recommended_hyperparams(self) -> dict:
        return {
            'epochs': 100,
            'batch_size': 64,
            'learning_rate': 0.0005,
            'optimizer': 'adam'
        }

    def estimate_resources(self, input_shape: tuple, num_classes: int) -> dict:
        # Rough estimation for 1D CNN
        flash_bytes = 20000  # More weights than dense
        ram_bytes = 4096     # Higher activation memory
        arena_bytes = 10000  
        
        return {
            'flash_bytes': flash_bytes,
            'ram_bytes': ram_bytes,
            'arena_bytes': arena_bytes,
            'latency_ms': 5.0 # Slower than simple dense
        }
