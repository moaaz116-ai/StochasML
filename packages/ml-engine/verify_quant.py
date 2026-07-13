import os
import numpy as np
import tensorflow as tf
from src.infera_ml.pipeline.quantizer import TFLiteQuantizer

def verify_quantization():
    print("--- 4. INT8 Quantization Verification ---")
    
    model_path = "test_verification_model.keras"
    if not os.path.exists(model_path):
        print("Model file not found. Run verify_training.py first.")
        return

    original_size = os.path.getsize(model_path)
    
    # Re-create the shape and data from verify_training
    timesteps = 50
    channels = 3
    input_size = timesteps * channels
    
    def rep_dataset():
        for _ in range(5):
            yield np.random.rand(1, input_size).astype(np.float32)

    print("Running TFLiteConverter with INT8 settings...")
    quantizer = TFLiteQuantizer(model_path)
    tflite_bytes = quantizer.quantize_int8(rep_dataset)
    
    with open("quantized_model.tflite", "wb") as f:
        f.write(tflite_bytes)
        
    quantized_size = len(tflite_bytes)
    
    print("\n--- Quantization Results ---")
    print(f"Original Float Keras Model Size: {original_size} bytes")
    print(f"Quantized INT8 TFLite Model Size: {quantized_size} bytes")
    print(f"Compression Ratio: {original_size / quantized_size:.2f}x")

    # Run inference test
    print("\nVerifying TFLite Interpreter Execution...")
    interpreter = tf.lite.Interpreter(model_content=tflite_bytes)
    interpreter.allocate_tensors()
    
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    
    # Quantization check
    print(f"Input Type: {input_details[0]['dtype']}")
    print(f"Output Type: {output_details[0]['dtype']}")
    
    # We expect int8
    assert input_details[0]['dtype'] == np.int8, "Input is not int8"
    assert output_details[0]['dtype'] == np.int8, "Output is not int8"
    
    # Prepare input
    scale, zero_point = input_details[0]['quantization']
    test_input = np.random.rand(1, input_size).astype(np.float32)
    test_input_int8 = np.round(test_input / scale + zero_point).astype(np.int8)
    
    interpreter.set_tensor(input_details[0]['index'], test_input_int8)
    interpreter.invoke()
    
    output_data_int8 = interpreter.get_tensor(output_details[0]['index'])
    out_scale, out_zero = output_details[0]['quantization']
    output_data_float = (output_data_int8.astype(np.float32) - out_zero) * out_scale
    
    print(f"Interpreter invocation successful. Dequantized output probabilities: {output_data_float}")

if __name__ == "__main__":
    verify_quantization()
