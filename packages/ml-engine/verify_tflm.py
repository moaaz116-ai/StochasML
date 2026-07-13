import os
import subprocess
from src.infera_ml.codegen.model_header import generate_model_header
from src.infera_ml.codegen.main_cpp import generate_main_cpp
from src.infera_ml.boards.specs import esp32s3
import json

def verify_tflm():
    print("--- 5. TFLite Micro Deployment Verification ---")
    
    tflite_path = "quantized_model.tflite"
    if not os.path.exists(tflite_path):
        print("Quantized model not found. Run verify_quant.py first.")
        return

    with open(tflite_path, "rb") as f:
        tflite_bytes = f.read()

    # 1. Generate model.h
    print("Generating model.h and model.cpp...")
    header_str, source_str = generate_model_header(tflite_bytes, "g_model")
    
    # 2. Generate main.cpp
    print("Generating main.cpp for ESP32-S3...")
    main_cpp_str = generate_main_cpp(num_features=150, num_classes=3, sensor_channels=3)
    
    # 3. Output to firmware folder
    firmware_dir = "../../firmware/core"
    
    with open(os.path.join(firmware_dir, "include", "model.h"), "w") as f:
        f.write(header_str)
        
    with open(os.path.join(firmware_dir, "src", "model.cpp"), "w") as f:
        f.write(source_str)
        
    with open(os.path.join(firmware_dir, "src", "main.cpp"), "w") as f:
        f.write(main_cpp_str)

    print(f"Firmware files successfully written to {firmware_dir}")
    print("To compile: 'cd ../../firmware/core && pio run'")

if __name__ == "__main__":
    verify_tflm()
