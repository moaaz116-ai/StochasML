import os
import shutil
import numpy as np
import pandas as pd
from src.infrastructure.storage.parquet_storage import ParquetStorage

def verify_parquet():
    print("--- 2. Parquet Storage Verification ---")
    base_dir = "test_storage"
    if os.path.exists(base_dir):
        shutil.rmtree(base_dir)

    storage = ParquetStorage(base_dir=base_dir)

    # 1. Generate a synthetic dataset (100 samples of 3 channels)
    print("Generating synthetic dataset (Sine/Cosine waves)...")
    dataset_id = "test-parquet-dataset"
    sample_id = "sample-001"
    label = "active_wave"

    t = np.linspace(0, 10, 100)
    data = [
        {
            "timestamp": int(t[i] * 1000),
            "accel_x": float(np.sin(t[i])),
            "accel_y": float(np.cos(t[i])),
            "accel_z": 9.8
        }
        for i in range(100)
    ]

    # 2. Save it to Parquet
    print("Saving to Parquet format with ZSTD compression...")
    filepath = storage.save_sample(dataset_id, sample_id, label, data)
    print(f"File saved to: {filepath}")
    
    file_size = os.path.getsize(filepath)
    print(f"File size on disk: {file_size} bytes")

    # 3. Read it back
    print("Reading Parquet file back into DataFrame...")
    df_read = storage.read_sample(filepath)

    # 4. Verify data is identical
    print("Verifying data integrity...")
    df_original = pd.DataFrame(data)
    df_original['label'] = label

    pd.testing.assert_frame_equal(df_original, df_read)
    print("Data is bit-for-bit identical! ✓")

    if os.path.exists(base_dir):
        shutil.rmtree(base_dir)

if __name__ == "__main__":
    verify_parquet()
