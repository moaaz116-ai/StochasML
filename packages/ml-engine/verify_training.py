import os
import numpy as np
from src.infera_ml.models.dense import DenseClassifier
from src.infera_ml.pipeline.trainer import ModelTrainer

def verify_training():
    print("--- 3. TensorFlow Training Verification ---")
    
    # 1. Generate realistic dataset (e.g. 3 classes of sine waves with different frequencies)
    print("Generating training data...")
    num_samples = 300
    timesteps = 50
    channels = 3
    num_classes = 3
    
    X = np.zeros((num_samples, timesteps, channels), dtype=np.float32)
    y = np.zeros((num_samples,), dtype=np.int32)
    
    t = np.linspace(0, 10, timesteps)
    for i in range(num_samples):
        class_id = i % 3
        y[i] = class_id
        
        freq = (class_id + 1) * 2
        X[i, :, 0] = np.sin(freq * t) + np.random.normal(0, 0.1, timesteps)
        X[i, :, 1] = np.cos(freq * t) + np.random.normal(0, 0.1, timesteps)
        X[i, :, 2] = np.random.normal(0, 0.2, timesteps) # Noise channel

    # Splitting manually for verification
    X_train, X_val = X[:240], X[240:]
    y_train, y_val = y[:240], y[240:]

    # Since DenseClassifier needs flattened features, we flatten manually here
    # In full pipeline, TimeSeriesFeatureExtractor handles this
    X_train_flat = X_train.reshape((X_train.shape[0], -1))
    X_val_flat = X_val.reshape((X_val.shape[0], -1))

    # 2. Train
    print("Initializing DenseClassifier Builder...")
    builder = DenseClassifier()
    hyperparams = builder.get_recommended_hyperparams()
    hyperparams['epochs'] = 10 # Speed up test
    
    trainer = ModelTrainer(builder, hyperparams)
    print("Starting Model.fit()...")
    result = trainer.train(X_train_flat, y_train, X_val_flat, y_val, num_classes)
    
    metrics = result['metrics']
    print("\n--- Training Results ---")
    print(f"Accuracy: {metrics['accuracy']:.4f}")
    print(f"Loss: {metrics['loss']:.4f}")
    print(f"Val Accuracy: {metrics['val_accuracy']:.4f}")
    print(f"Val Loss: {metrics['val_loss']:.4f}")
    
    model_path = result['model_path']
    print(f"Saved model to: {model_path}")
    print(f"Model file size: {os.path.getsize(model_path)} bytes")
    
    import tensorflow as tf
    model = tf.keras.models.load_model(model_path)
    model.summary()
    
    # Save the model for the next verification step
    os.rename(model_path, "test_verification_model.keras")

if __name__ == "__main__":
    verify_training()
