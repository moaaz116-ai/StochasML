import os
import uuid
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
from typing import List, Dict

class ParquetStorage:
    def __init__(self, base_dir: str = "data/storage"):
        self.base_dir = base_dir
        os.makedirs(self.base_dir, exist_ok=True)

    def save_sample(self, dataset_id: str, sample_id: str, label: str, data: List[Dict]) -> str:
        """
        Saves time-series data to a Parquet file.
        data format: [{"timestamp": 0, "accel_x": 1.0, ...}, ...]
        Returns the file path.
        """
        # Create dataset partition directory
        dataset_dir = os.path.join(self.base_dir, dataset_id)
        os.makedirs(dataset_dir, exist_ok=True)
        
        filepath = os.path.join(dataset_dir, f"{sample_id}.parquet")
        
        # Convert to pandas DataFrame then to PyArrow Table
        df = pd.DataFrame(data)
        
        # Add label column for easier bulk loading later
        df['label'] = label
        
        table = pa.Table.from_pandas(df)
        
        # Write to Parquet using ZSTD compression for TinyML efficiency
        pq.write_table(table, filepath, compression='ZSTD')
        
        return filepath

    def read_sample(self, filepath: str) -> pd.DataFrame:
        """Reads a Parquet file back into a Pandas DataFrame."""
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Parquet file not found: {filepath}")
        return pq.read_table(filepath).to_pandas()
