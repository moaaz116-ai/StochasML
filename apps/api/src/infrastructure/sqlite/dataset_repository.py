import sqlite3
import json
import os
from typing import Dict, List, Optional
from datetime import datetime
from src.domain.entities.dataset import Dataset, DataType, Label
from src.domain.repositories.dataset_repository import DatasetRepository

class SQLiteDatasetRepository(DatasetRepository):
    def __init__(self, db_path: str = "infera.db"):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS datasets (
                    id TEXT PRIMARY KEY,
                    project_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    description TEXT,
                    data_type TEXT NOT NULL,
                    schema_version TEXT,
                    sample_count INTEGER DEFAULT 0,
                    label_count INTEGER DEFAULT 0,
                    total_size_bytes INTEGER DEFAULT 0,
                    storage_url TEXT,
                    created_at TIMESTAMP,
                    updated_at TIMESTAMP,
                    labels_json TEXT
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS samples (
                    id TEXT PRIMARY KEY,
                    dataset_id TEXT NOT NULL,
                    filename TEXT NOT NULL,
                    label TEXT NOT NULL,
                    size INTEGER NOT NULL,
                    data_reference TEXT NOT NULL,
                    metadata_json TEXT,
                    split TEXT DEFAULT 'train',
                    is_disabled INTEGER DEFAULT 0,
                    created_at TIMESTAMP,
                    FOREIGN KEY(dataset_id) REFERENCES datasets(id)
                )
            """)
            # Migration: add columns if missing (for existing DBs)
            try:
                conn.execute("ALTER TABLE samples ADD COLUMN split TEXT DEFAULT 'train'")
            except Exception:
                pass
            try:
                conn.execute("ALTER TABLE samples ADD COLUMN is_disabled INTEGER DEFAULT 0")
            except Exception:
                pass
            
            # Backfill and indexing
            try:
                conn.execute("UPDATE samples SET split = 'train' WHERE split IS NULL")
                conn.execute("UPDATE samples SET is_disabled = 0 WHERE is_disabled IS NULL")
                conn.execute("CREATE INDEX IF NOT EXISTS idx_samples_dataset_split ON samples(dataset_id, split)")
            except Exception:
                pass
            
            # Seed default demo datasets if empty
            cursor = conn.execute("SELECT COUNT(*) FROM datasets")
            if cursor.fetchone()[0] == 0:
                demo_datasets = [
                    (
                        "default-dataset-1",
                        "proj-accel",
                        "Dummy Accelerometer Data",
                        "Pre-loaded 3-axis sine wave dataset with idle/active classes.",
                        "sensor",
                        "1.0",
                        50,
                        2,
                        128000,
                        "data/storage/",
                        datetime.now().isoformat(),
                        datetime.now().isoformat(),
                        json.dumps([{"name": "idle", "color": "#888888"}, {"name": "active", "color": "#ff4444"}])
                    ),
                    (
                        "ds-gestures",
                        "proj-accel",
                        "Gesture Recordings",
                        "Real accelerometer recordings of swipe, tap, and circle gestures.",
                        "sensor",
                        "1.0",
                        320,
                        3,
                        4500000,
                        "data/storage/",
                        datetime.now().isoformat(),
                        datetime.now().isoformat(),
                        json.dumps([{"name": "swipe", "color": "#6366f1"}, {"name": "tap", "color": "#22d3ee"}, {"name": "circle", "color": "#f59e0b"}])
                    ),
                    (
                        "ds-audio",
                        "proj-kws",
                        "Wake Word Audio",
                        "\"Hey Infera\" keyword recordings, 1s clips at 16kHz.",
                        "audio",
                        "1.0",
                        500,
                        2,
                        16000000,
                        "data/storage/",
                        datetime.now().isoformat(),
                        datetime.now().isoformat(),
                        json.dumps([{"name": "hey_infera", "color": "#a855f7"}, {"name": "background", "color": "#64748b"}])
                    ),
                    (
                        "ds-vww",
                        "proj-vww",
                        "Person Detection Images",
                        "96x96 grayscale images for visual wake word detection.",
                        "image",
                        "1.0",
                        1200,
                        2,
                        22000000,
                        "data/storage/",
                        datetime.now().isoformat(),
                        datetime.now().isoformat(),
                        json.dumps([{"name": "person", "color": "#10b981"}, {"name": "no_person", "color": "#ef4444"}])
                    )
                ]
                conn.executemany("""
                    INSERT INTO datasets 
                    (id, project_id, name, description, data_type, schema_version, sample_count, label_count, total_size_bytes, storage_url, created_at, updated_at, labels_json)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, demo_datasets)

    def save(self, dataset: Dataset) -> None:
        with self._get_connection() as conn:
            labels_json = json.dumps([{"name": l.name, "color": l.color} for l in dataset.labels])
            conn.execute("""
                INSERT OR REPLACE INTO datasets 
                (id, project_id, name, description, data_type, schema_version, sample_count, label_count, total_size_bytes, storage_url, created_at, updated_at, labels_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                dataset.id, dataset.project_id, dataset.name, dataset.description, 
                dataset.data_type.value, dataset.schema_version, dataset.sample_count, 
                dataset.label_count, dataset.total_size_bytes, dataset.storage_url, 
                dataset.created_at.isoformat(), dataset.updated_at.isoformat(), labels_json
            ))

    def get_by_id(self, dataset_id: str) -> Optional[Dataset]:
        with self._get_connection() as conn:
            row = conn.execute("SELECT * FROM datasets WHERE id = ?", (dataset_id,)).fetchone()
            if not row:
                return None
            return self._row_to_dataset(row)

    def list_by_project(self, project_id: str) -> List[Dataset]:
        with self._get_connection() as conn:
            rows = conn.execute("SELECT * FROM datasets WHERE project_id = ?", (project_id,)).fetchall()
            return [self._row_to_dataset(row) for row in rows]

    def _row_to_dataset(self, row: sqlite3.Row) -> Dataset:
        labels_data = json.loads(row["labels_json"] or "[]")
        labels = [Label(**l) for l in labels_data]
        return Dataset(
            id=row["id"],
            project_id=row["project_id"],
            name=row["name"],
            description=row["description"],
            data_type=DataType(row["data_type"]),
            schema_version=row["schema_version"],
            sample_count=row["sample_count"],
            label_count=row["label_count"],
            total_size_bytes=row["total_size_bytes"],
            storage_url=row["storage_url"],
            created_at=datetime.fromisoformat(row["created_at"]),
            updated_at=datetime.fromisoformat(row["updated_at"]),
            labels=labels
        )

    def add_sample_record(self, sample_id: str, dataset_id: str, filename: str, label: str, size: int, data_ref: str, metadata: dict = None, split: str = 'train'):
        with self._get_connection() as conn:
            metadata_str = json.dumps(metadata) if metadata else "{}"
            conn.execute("""
                INSERT OR REPLACE INTO samples (id, dataset_id, filename, label, size, data_reference, metadata_json, split, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (sample_id, dataset_id, filename, label, size, data_ref, metadata_str, split, datetime.now().isoformat()))

    def list_samples(self, dataset_id: str, split: str = None) -> List[dict]:
        with self._get_connection() as conn:
            if split:
                rows = conn.execute("SELECT * FROM samples WHERE dataset_id = ? AND split = ? ORDER BY created_at DESC", (dataset_id, split)).fetchall()
            else:
                rows = conn.execute("SELECT * FROM samples WHERE dataset_id = ? ORDER BY created_at DESC", (dataset_id,)).fetchall()
            samples = []
            for r in rows:
                samples.append({
                    "id": r["id"],
                    "dataset_id": r["dataset_id"],
                    "filename": r["filename"],
                    "label": r["label"],
                    "size": r["size"],
                    "data_reference": r["data_reference"],
                    "split": r["split"] if "split" in r.keys() else "train",
                    "is_disabled": bool(r["is_disabled"]) if "is_disabled" in r.keys() else False,
                    "metadata": json.loads(r["metadata_json"]) if r["metadata_json"] else {},
                    "created_at": r["created_at"]
                })
            return samples

    def get_sample_record(self, sample_id: str) -> Optional[dict]:
        with self._get_connection() as conn:
            r = conn.execute("SELECT * FROM samples WHERE id = ?", (sample_id,)).fetchone()
            if not r:
                return None
            return {
                "id": r["id"],
                "dataset_id": r["dataset_id"],
                "filename": r["filename"],
                "label": r["label"],
                "size": r["size"],
                "data_reference": r["data_reference"],
                "split": r["split"] if "split" in r.keys() else "train",
                "is_disabled": bool(r["is_disabled"]) if "is_disabled" in r.keys() else False,
                "metadata": json.loads(r["metadata_json"]) if r["metadata_json"] else {},
                "created_at": r["created_at"]
            }

    def delete_sample_record(self, sample_id: str) -> None:
        with self._get_connection() as conn:
            conn.execute("DELETE FROM samples WHERE id = ?", (sample_id,))

    def update_sample_record(self, sample_id: str, label: str = None, filename: str = None, metadata: dict = None, split: str = None, is_disabled: bool = None) -> None:
        with self._get_connection() as conn:
            fields = []
            vals = []
            if label is not None:
                fields.append("label = ?")
                vals.append(label)
            if filename is not None:
                fields.append("filename = ?")
                vals.append(filename)
            if metadata is not None:
                fields.append("metadata_json = ?")
                vals.append(json.dumps(metadata))
            if split is not None:
                fields.append("split = ?")
                vals.append(split)
            if is_disabled is not None:
                fields.append("is_disabled = ?")
                vals.append(1 if is_disabled else 0)
            if not fields:
                return
            query = f"UPDATE samples SET {', '.join(fields)} WHERE id = ?"
            conn.execute(query, tuple(vals + [sample_id]))

