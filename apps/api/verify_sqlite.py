import os
import sqlite3
from datetime import datetime
from src.domain.entities.dataset import Dataset, DataType, Label
from src.infrastructure.sqlite.dataset_repository import SQLiteDatasetRepository

def verify_sqlite():
    db_path = "test_infera.db"
    if os.path.exists(db_path):
        os.remove(db_path)

    print("--- 1. SQLite Verification ---")
    repo = SQLiteDatasetRepository(db_path=db_path)

    # Create a Dataset
    ds = Dataset(
        id="test-dataset-id",
        project_id="test-project-id",
        name="Test Sensor Dataset",
        description="A dataset for testing SQLite",
        data_type=DataType.SENSOR,
        schema_version="1.0",
        sample_count=0,
        label_count=2,
        total_size_bytes=1024,
        storage_url="data/storage",
        created_at=datetime.now(),
        updated_at=datetime.now(),
        labels=[Label("idle", "#aaaaaa"), Label("active", "#ff0000")]
    )

    print("Saving dataset to repository...")
    repo.save(ds)

    print("\nRetrieving dataset from repository...")
    retrieved_ds = repo.get_by_id("test-dataset-id")
    print(f"Retrieved Dataset Name: {retrieved_ds.name}")
    print(f"Retrieved Dataset Labels: {[l.name for l in retrieved_ds.labels]}")

    print("\nRaw Database Schema:")
    conn = sqlite3.connect(db_path)
    schema = conn.execute("SELECT sql FROM sqlite_master WHERE type='table'").fetchall()
    for row in schema:
        print(row[0])

    print("\nRaw Database Content:")
    rows = conn.execute("SELECT * FROM datasets").fetchall()
    for row in rows:
        print(dict(zip([column[0] for column in conn.execute("SELECT * FROM datasets").description], row)))

    conn.close()
    if os.path.exists(db_path):
        os.remove(db_path)

if __name__ == "__main__":
    verify_sqlite()
