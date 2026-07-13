import os
import sys
import uuid
import math
import numpy as np
from datetime import datetime

# Add the 'apps/api' root to the Python path to allow imports from src
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.domain.entities.dataset import Dataset, DataType, Label
from src.infrastructure.sqlite.dataset_repository import SQLiteDatasetRepository
from src.infrastructure.storage.parquet_storage import ParquetStorage

def generate_sample(label: str, length: int = 100) -> list:
    """Generates a dummy 3-channel accelerometer signal."""
    # X, Y, Z axes
    sample = []
    for i in range(length):
        if label == "active":
            # Sine wave + noise
            t = i * 0.1
            x = math.sin(t) + np.random.normal(0, 0.1)
            y = math.cos(t) + np.random.normal(0, 0.1)
            z = math.sin(t * 1.5) + np.random.normal(0, 0.1)
            sample.append([x, y, z])
        else:
            # Flatline + noise
            sample.append([
                np.random.normal(0, 0.05),
                np.random.normal(0, 0.05),
                np.random.normal(0, 0.05)
            ])
    return sample

def seed_database():
    print("Seeding database with a dummy dataset...")
    db_path = "test_infera.db" # Default used in our system currently
    repo = SQLiteDatasetRepository(db_path=db_path)
    storage = ParquetStorage(base_dir="data/storage")

    # Ensure a "test-project" exists (we will just reuse the dummy dataset's project ID)
    project_id = "test-project"
    dataset_id = "default-dataset-1"
    
    # Check if dataset already exists
    existing = repo.get_by_id(dataset_id)
    if existing:
        print(f"Dataset {dataset_id} already exists. Skipping seed.")
        return

    ds = Dataset(
        id=dataset_id,
        project_id=project_id,
        name="Dummy Accelerometer Data",
        description="A pre-loaded 3-axis accelerometer dataset containing 'idle' and 'active' samples.",
        data_type=DataType.SENSOR,
        schema_version="1.0",
        sample_count=0,
        label_count=2,
        total_size_bytes=0,
        storage_url="data/storage/",
        created_at=datetime.now(),
        updated_at=datetime.now(),
        labels=[Label("idle", "#888888"), Label("active", "#ff4444")]
    )
    
    print(f"Creating Dataset {dataset_id}...")
    repo.save(ds)

    samples_per_class = 25
    print(f"Generating {samples_per_class} samples for each class...")
    
    for label in ["idle", "active"]:
        for _ in range(samples_per_class):
            sample_data = generate_sample(label)
            sample_id = str(uuid.uuid4())
            filepath = storage.save_sample(dataset_id, sample_id, label, sample_data)
            
            ds.sample_count += 1
            ds.total_size_bytes += os.path.getsize(filepath)
    
    ds.updated_at = datetime.now()
    repo.save(ds)
    print("Seeding complete!")

if __name__ == "__main__":
    seed_database()
