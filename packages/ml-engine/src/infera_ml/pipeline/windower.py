from .base import PipelineStage, PipelineContext
import numpy as np

class DataWindower(PipelineStage):
    def __init__(self, window_size: int, stride: int):
        self.window_size = window_size
        self.stride = stride

    def execute(self, context: PipelineContext) -> PipelineContext:
        data = context.data
        labels = context.labels
        
        if len(data) < self.window_size:
            raise ValueError(f"Data length ({len(data)}) is less than window size ({self.window_size})")
            
        # Standard sliding window approach
        num_windows = ((len(data) - self.window_size) // self.stride) + 1
        
        # Simple extraction
        windows = []
        window_labels = []
        
        for i in range(num_windows):
            start = i * self.stride
            end = start + self.window_size
            windows.append(data[start:end])
            
            # Label assignment strategy: take the mode or just use the label of the first element
            # For simplicity, assuming homogeneous label per window initially
            window_labels.append(labels[start]) 
            
        context.data = np.array(windows)
        context.labels = np.array(window_labels)
        
        return context
