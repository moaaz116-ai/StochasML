from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Request
from typing import List, Optional
import uuid
import json
import os
from datetime import datetime
from src.presentation.schemas.dataset_schemas import CreateDatasetDTO, DatasetResponseDTO, CreateSampleDTO
from src.domain.entities.dataset import DataType, Dataset, Label
from src.domain.entities.sample import Sample
from src.infrastructure.sqlite.dataset_repository import SQLiteDatasetRepository
from src.infrastructure.storage.parquet_storage import ParquetStorage

router = APIRouter()

dataset_repo = SQLiteDatasetRepository()
storage = ParquetStorage()

@router.get("/detail/{dataset_id}", response_model=DatasetResponseDTO)
async def get_dataset_detail(dataset_id: str):
    dataset = dataset_repo.get_by_id(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset

@router.get("/{project_id}/datasets", response_model=List[DatasetResponseDTO])
async def list_datasets(project_id: str):
    datasets = dataset_repo.list_by_project(project_id)
    return datasets

@router.post("/", response_model=DatasetResponseDTO)
async def create_dataset(dataset_dto: CreateDatasetDTO):
    new_dataset = Dataset(
        id=str(uuid.uuid4()),
        project_id=dataset_dto.project_id,
        name=dataset_dto.name,
        description=dataset_dto.description,
        data_type=dataset_dto.data_type,
        schema_version="1.0",
        sample_count=0,
        label_count=len(dataset_dto.labels),
        total_size_bytes=0,
        storage_url=f"data/storage/",
        created_at=datetime.now(),
        updated_at=datetime.now(),
        labels=[Label(name=l.name, color=l.color) for l in dataset_dto.labels]
    )
    dataset_repo.save(new_dataset)
    return new_dataset

@router.post("/{dataset_id}/samples")
async def upload_sample(
    request: Request,
    dataset_id: str,
    label: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    metadata_json: Optional[str] = Form(None)
):
    dataset = dataset_repo.get_by_id(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    content_type = request.headers.get("content-type", "")
    split = "train"
    metadata = {}

    if "application/json" in content_type:
        # JSON upload (typically live classification capture save)
        try:
            body = await request.json()
            label = body.get("label")
            data = body.get("data")
            metadata = body.get("metadata", {})
            split = body.get("split", "train")
            if not label or not data or not isinstance(data, list):
                raise ValueError("JSON must include 'label' and 'data' array.")
            # Format size based on data points
            size = len(data) * 8 * (len(data[0]) if len(data) > 0 and isinstance(data[0], list) else 1)
            filename = f"capture_{int(datetime.now().timestamp())}.parquet"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON body: {str(e)}")
    else:
        # Form / Multipart upload
        if not file or not label:
            raise HTTPException(status_code=400, detail="Form uploads require 'file' and 'label'")
        contents = await file.read()
        size = len(contents)
        filename = file.filename
        try:
            data = json.loads(contents.decode('utf-8'))
            if not isinstance(data, list):
                raise ValueError("Expected an array of sample data points")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid file format: {str(e)}")

        if metadata_json:
            try:
                metadata = json.loads(metadata_json)
            except Exception:
                pass

    sample_id = str(uuid.uuid4())
    filepath = storage.save_sample(dataset_id, sample_id, label, data)

    # Save record to SQLite
    dataset_repo.add_sample_record(
        sample_id=sample_id,
        dataset_id=dataset_id,
        filename=filename,
        label=label,
        size=size,
        data_ref=filepath,
        metadata=metadata,
        split=split
    )

    # Update dataset stats
    dataset.sample_count += 1
    if filepath and os.path.exists(filepath):
        dataset.total_size_bytes += os.path.getsize(filepath)
    else:
        dataset.total_size_bytes += size
    dataset.updated_at = datetime.now()

    # Add label if it doesn't exist
    if not any(l.name == label for l in dataset.labels):
        dataset.labels.append(Label(name=label, color="#8b5cf6"))
        dataset.label_count += 1

    dataset_repo.save(dataset)

    return {"id": sample_id, "status": "uploaded", "size": size, "path": filepath}

@router.get("/{dataset_id}/samples")
async def get_dataset_samples(dataset_id: str):
    return dataset_repo.list_samples(dataset_id)

@router.get("/samples/{sample_id}")
async def get_sample_detail(sample_id: str):
    sample = dataset_repo.get_sample_record(sample_id)
    if not sample:
        raise HTTPException(status_code=404, detail="Sample not found")
        
    # Read raw parquet values for waveform preview
    try:
        df = storage.read_sample(sample["data_reference"])
        # Exclude label column to get raw values array
        cols = [c for c in df.columns if c != 'label']
        raw_values = df[cols].values.tolist()
        sample["payload"] = raw_values
    except Exception as e:
        sample["payload"] = []
        sample["error"] = f"Failed to load raw values: {str(e)}"
        
    return sample

@router.put("/samples/{sample_id}")
async def update_sample(sample_id: str, update_dto: dict):
    sample = dataset_repo.get_sample_record(sample_id)
    if not sample:
        raise HTTPException(status_code=404, detail="Sample not found")
        
    label = update_dto.get("label")
    filename = update_dto.get("filename")
    metadata = update_dto.get("metadata")
    split = update_dto.get("split")
    is_disabled = update_dto.get("is_disabled")
    
    # Handle crop/split window payload modification if specified
    # e.g. update_dto contains "crop_start" and "crop_end" offsets
    crop_start = update_dto.get("crop_start")
    crop_end = update_dto.get("crop_end")
    if (crop_start is not None or crop_end is not None) and sample["data_reference"]:
        try:
            df = storage.read_sample(sample["data_reference"])
            cols = [c for c in df.columns if c != 'label']
            raw_values = df[cols].values.tolist()
            
            # Slice the array based on indexes
            start_idx = max(0, int(crop_start)) if crop_start is not None else 0
            end_idx = min(len(raw_values), int(crop_end)) if crop_end is not None else len(raw_values)
            sliced_values = raw_values[start_idx:end_idx]
            
            # Re-save the sliced parquet file
            storage.save_sample(sample["dataset_id"], sample_id, label or sample["label"], sliced_values)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to crop sample data: {str(e)}")

    # Update sqlite database record — split and is_disabled are now persisted
    dataset_repo.update_sample_record(
        sample_id=sample_id,
        label=label,
        filename=filename,
        metadata=metadata,
        split=split,
        is_disabled=is_disabled
    )
    return {"status": "updated"}

@router.delete("/samples/{sample_id}")
async def delete_sample(sample_id: str):
    sample = dataset_repo.get_sample_record(sample_id)
    if not sample:
        raise HTTPException(status_code=404, detail="Sample not found")
        
    # Delete file from disk
    if sample["data_reference"] and os.path.exists(sample["data_reference"]):
        try:
            os.remove(sample["data_reference"])
        except Exception:
            pass
            
    # Delete SQLite record
    dataset_repo.delete_sample_record(sample_id)
    
    # Decrement dataset sample count
    dataset = dataset_repo.get_by_id(sample["dataset_id"])
    if dataset:
        dataset.sample_count = max(0, dataset.sample_count - 1)
        dataset_repo.save(dataset)
        
    return {"status": "deleted"}

@router.put("/{dataset_id}/labels")
async def update_dataset_labels(dataset_id: str, payload: dict):
    dataset = dataset_repo.get_by_id(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    labels_data = payload.get("labels", [])
    new_names = [l["name"] for l in labels_data]
    old_names = [l.name for l in dataset.labels]

    # Get samples for this dataset
    samples = dataset_repo.list_samples(dataset_id)
    used_labels = set(s["label"] for s in samples)

    # 1. Identify deleted and renamed labels
    deleted_labels = [o for o in old_names if o not in new_names]
    added_labels = [n for n in new_names if n not in old_names]

    # 2. Check if a deleted label is currently in use
    for dl in deleted_labels:
        if dl in used_labels:
            # If there's exactly 1 added label and 1 deleted label, treat it as a rename
            if len(deleted_labels) == 1 and len(added_labels) == 1:
                new_name = added_labels[0]
                # Update SQLite records for samples
                for s in samples:
                    if s["label"] == dl:
                        dataset_repo.update_sample_record(s["id"], label=new_name)
                continue
            
            # Check if replacement label was supplied in payload
            replacement = payload.get("replacement_labels", {}).get(dl)
            if replacement and replacement in new_names:
                for s in samples:
                    if s["label"] == dl:
                        dataset_repo.update_sample_record(s["id"], label=replacement)
                continue

            raise HTTPException(
                status_code=409,
                detail=f"Cannot delete label '{dl}' because it is currently used by samples. Please choose a replacement label or delete the samples first."
            )

    dataset.labels = [Label(name=l["name"], color=l["color"]) for l in labels_data]
    dataset.label_count = len(dataset.labels)
    dataset.updated_at = datetime.now()
    
    # Recalculate label sample counts for dataset
    for label in dataset.labels:
        label.sample_count = sum(1 for s in samples if s["label"] == label.name)

    dataset_repo.save(dataset)
    return dataset


@router.post("/{dataset_id}/rebalance_split")
async def rebalance_dataset_split(dataset_id: str, payload: dict = None):
    """
    Automatically rebalance train/test split across all labels to 80/20 ratio.
    """
    dataset = dataset_repo.get_by_id(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    train_ratio = float(payload.get("trainRatio", 0.8)) if payload else 0.8
    samples = dataset_repo.list_samples(dataset_id)

    # Group by label
    by_label = {}
    for s in samples:
        lbl = s.get("label", "unknown")
        by_label.setdefault(lbl, []).append(s)

    train_count = 0
    test_count = 0

    for lbl, group in by_label.items():
        n = len(group)
        n_train = max(1, int(round(n * train_ratio))) if n > 1 else 1
        for idx, s in enumerate(group):
            target_split = "train" if idx < n_train else "test"
            dataset_repo.update_sample_record(s["id"], split=target_split)
            if target_split == "train":
                train_count += 1
            else:
                test_count += 1

    return {
        "status": "rebalanced",
        "trainCount": train_count,
        "testCount": test_count,
        "totalSamples": len(samples)
    }


