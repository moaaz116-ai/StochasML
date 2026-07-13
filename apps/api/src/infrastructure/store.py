import sqlite3
import json
import os
import time
from typing import Dict, Any, List

DB_PATH = "infera.db"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db_tables():
    with get_db_connection() as conn:
        # Projects Table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                dataType TEXT,
                targetBoard TEXT,
                sampleRate INTEGER,
                channelCount INTEGER,
                channelNames TEXT,
                createdAt TEXT,
                updatedAt TEXT,
                datasetCount INTEGER DEFAULT 0,
                modelCount INTEGER DEFAULT 0,
                deploymentCount INTEGER DEFAULT 0,
                impulseConfig TEXT
            )
        """)
        
        # Models Table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS models (
                id TEXT PRIMARY KEY,
                experimentId TEXT,
                projectId TEXT,
                name TEXT,
                status TEXT,
                architecture TEXT,
                accuracy REAL,
                loss REAL,
                size INTEGER,
                latency REAL,
                format TEXT,
                quantized INTEGER,
                executionMode TEXT,
                createdAt TEXT
            )
        """)
        
        # Deployments Table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS deployments (
                id TEXT PRIMARY KEY,
                projectId TEXT,
                modelId TEXT,
                target TEXT,
                status TEXT,
                firmwareUrl TEXT,
                created_timestamp REAL,
                createdAt TEXT
            )
        """)
        
        # Experiments Table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS experiments (
                id TEXT PRIMARY KEY,
                project_id TEXT,
                name TEXT,
                status TEXT,
                architecture TEXT,
                config TEXT,
                metrics TEXT,
                logs TEXT,
                created_at TEXT,
                completed_at TEXT
            )
        """)
        
        # Seed default project if empty
        cursor = conn.execute("SELECT COUNT(*) FROM projects")
        if cursor.fetchone()[0] == 0:
            conn.execute("""
                INSERT INTO projects (id, name, description, dataType, targetBoard, sampleRate, channelCount, channelNames, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "proj-accel", 
                "Accelerometer Gesture Recognition", 
                "Classify hand gestures using IMU sensor data from ESP32-S3.",
                "sensor",
                "esp32-s3",
                50,
                3,
                "accel_x, accel_y, accel_z",
                "2026-06-15T10:00:00Z",
                "2026-07-05T14:22:00Z"
            ))

# Run migrations immediately on load
init_db_tables()

class SQLiteRecordProxy(dict):
    """
    A dictionary subclass that automatically propagates updates back to the parent table.
    """
    def __init__(self, table_name: str, key_name: str, key_val: str, data: dict):
        super().__init__(data)
        self.table_name = table_name
        self.key_name = key_name
        self.key_val = key_val

    def __setitem__(self, key, value):
        super().__setitem__(key, value)
        self._save_to_db()

    def update(self, other=None, **kwargs):
        if other is not None:
            super().update(other)
        if kwargs:
            super().update(kwargs)
        self._save_to_db()

    def _save_to_db(self):
        # Serialize fields back to their database column equivalents
        data_to_save = dict(self)
        
        # Check if columns exist in the target table to avoid sqlite syntax errors
        with get_db_connection() as conn:
            cursor = conn.execute(f"PRAGMA table_info({self.table_name})")
            columns = [col[1] for col in cursor.fetchall()]
            
        fields = []
        vals = []
        for k, v in data_to_save.items():
            # Standard mappings
            if k in columns:
                fields.append(k)
                if isinstance(v, (dict, list)):
                    vals.append(json.dumps(v))
                elif isinstance(v, bool):
                    vals.append(1 if v else 0)
                else:
                    vals.append(v)
                    
        if not fields:
            return
            
        set_clause = ", ".join([f"{f} = ?" for f in fields])
        query = f"UPDATE {self.table_name} SET {set_clause} WHERE {self.key_name} = ?"
        
        with get_db_connection() as conn:
            conn.execute(query, tuple(vals + [self.key_val]))

class SQLiteDictProxy:
    """
    A dictionary proxy class that maps operations directly to SQLite.
    """
    def __init__(self, table_name: str, key_name: str = "id"):
        self.table_name = table_name
        self.key_name = key_name

    def __getitem__(self, key) -> SQLiteRecordProxy:
        with get_db_connection() as conn:
            row = conn.execute(f"SELECT * FROM {self.table_name} WHERE {self.key_name} = ?", (key,)).fetchone()
            if not row:
                raise KeyError(key)
            return self._row_to_proxy(row)

    def __setitem__(self, key, value):
        # Insert or replace
        data = dict(value)
        data[self.key_name] = key
        
        with get_db_connection() as conn:
            cursor = conn.execute(f"PRAGMA table_info({self.table_name})")
            columns = [col[1] for col in cursor.fetchall()]
            
        fields = []
        placeholders = []
        vals = []
        for k, v in data.items():
            if k in columns:
                fields.append(k)
                placeholders.append("?")
                if isinstance(v, (dict, list)):
                    vals.append(json.dumps(v))
                elif isinstance(v, bool):
                    vals.append(1 if v else 0)
                else:
                    vals.append(v)
                    
        query = f"INSERT OR REPLACE INTO {self.table_name} ({', '.join(fields)}) VALUES ({', '.join(placeholders)})"
        with get_db_connection() as conn:
            conn.execute(query, tuple(vals))

    def __delitem__(self, key):
        if key not in self:
            raise KeyError(key)
        with get_db_connection() as conn:
            conn.execute(f"DELETE FROM {self.table_name} WHERE {self.key_name} = ?", (key,))

    def __contains__(self, key) -> bool:
        with get_db_connection() as conn:
            row = conn.execute(f"SELECT 1 FROM {self.table_name} WHERE {self.key_name} = ?", (key,)).fetchone()
            return row is not None

    def __len__(self) -> int:
        with get_db_connection() as conn:
            cursor = conn.execute(f"SELECT COUNT(*) FROM {self.table_name}")
            return cursor.fetchone()[0]

    def get(self, key, default=None):
        try:
            return self[key]
        except KeyError:
            return default

    def values(self) -> List[SQLiteRecordProxy]:
        with get_db_connection() as conn:
            rows = conn.execute(f"SELECT * FROM {self.table_name}").fetchall()
            return [self._row_to_proxy(row) for row in rows]

    def keys(self) -> List[str]:
        with get_db_connection() as conn:
            rows = conn.execute(f"SELECT {self.key_name} FROM {self.table_name}").fetchall()
            return [row[0] for row in rows]

    def _row_to_proxy(self, row: sqlite3.Row) -> SQLiteRecordProxy:
        data = {}
        for key in row.keys():
            val = row[key]
            # Deserialize JSON fields
            if isinstance(val, str) and (val.startswith("{") or val.startswith("[")):
                try:
                    val = json.loads(val)
                except Exception:
                    pass
            if key == "channelNames" and isinstance(val, str):
                try:
                    parsed = json.loads(val)
                    val = parsed if isinstance(parsed, list) else [s.strip() for s in val.split(",") if s.strip()]
                except Exception:
                    val = [s.strip() for s in val.split(",") if s.strip()]
            # Map sqlite 1/0 back to Boolean for quantized flag
            if key == "quantized" and val is not None:
                val = bool(val)
            data[key] = val
        return SQLiteRecordProxy(self.table_name, self.key_name, row[self.key_name], data)

_projects = SQLiteDictProxy("projects")
_models = SQLiteDictProxy("models")
_deployments = SQLiteDictProxy("deployments")
_experiments = SQLiteDictProxy("experiments", "id")

# Datasets is handled separately by the database repositories, but we can expose _datasets as helper proxy
_datasets = SQLiteDictProxy("datasets")

def get_store():
    return {
        "projects": _projects,
        "datasets": _datasets,
        "experiments": _experiments,
        "models": _models,
        "deployments": _deployments
    }
