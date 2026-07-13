from .base import PipelineStage, PipelineContext
from sklearn.model_selection import train_test_split
import numpy as np

class DataSplitter(PipelineStage):
    def __init__(self, train_ratio=0.7, val_ratio=0.15, test_ratio=0.15, random_seed=42):
        self.train_ratio = train_ratio
        self.val_ratio = val_ratio
        self.test_ratio = test_ratio
        self.random_seed = random_seed
        
        if not np.isclose(train_ratio + val_ratio + test_ratio, 1.0):
            raise ValueError("Split ratios must sum to 1.0")

    def execute(self, context: PipelineContext) -> PipelineContext:
        X = context.data
        y = context.labels
        
        # Calculate ratio for the first split (train vs temp)
        temp_ratio = self.val_ratio + self.test_ratio
        
        # Determine if we can do stratified sampling
        unique_classes, class_counts = np.unique(y, return_counts=True)
        stratify_param = y if min(class_counts) >= 2 else None
        
        # First split: Train vs Temp (Val + Test)
        X_train, X_temp, y_train, y_temp = train_test_split(
            X, y, test_size=temp_ratio, random_state=self.random_seed, stratify=stratify_param
        )
        
        # Calculate ratio for the second split (val vs test) relative to temp
        relative_test_ratio = self.test_ratio / temp_ratio
        
        # Recalculate stratification for the second split
        unique_temp, temp_counts = np.unique(y_temp, return_counts=True)
        stratify_temp = y_temp if min(temp_counts) >= 2 else None
        
        # Second split: Val vs Test
        X_val, X_test, y_val, y_test = train_test_split(
            X_temp, y_temp, test_size=relative_test_ratio, random_state=self.random_seed, stratify=stratify_temp
        )
        
        context.metadata['splits'] = {
            'train': {'data': X_train, 'labels': y_train},
            'val': {'data': X_val, 'labels': y_val},
            'test': {'data': X_test, 'labels': y_test}
        }
        
        return context
