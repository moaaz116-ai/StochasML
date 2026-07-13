from .base import PipelineStage, PipelineContext
import numpy as np

class DataNormalizer(PipelineStage):
    def __init__(self, method: str = 'zscore'):
        if method not in ['zscore', 'minmax']:
            raise ValueError("Method must be 'zscore' or 'minmax'")
        self.method = method

    def execute(self, context: PipelineContext) -> PipelineContext:
        data = context.data
        
        if self.method == 'zscore':
            mean = np.mean(data, axis=0)
            std = np.std(data, axis=0)
            # Prevent division by zero
            std[std == 0] = 1.0 
            
            normalized_data = (data - mean) / std
            context.metadata['normalization'] = {
                'method': 'zscore',
                'mean': mean.tolist() if isinstance(mean, np.ndarray) else mean,
                'std': std.tolist() if isinstance(std, np.ndarray) else std
            }
            
        elif self.method == 'minmax':
            d_min = np.min(data, axis=0)
            d_max = np.max(data, axis=0)
            d_range = d_max - d_min
            # Prevent division by zero
            d_range[d_range == 0] = 1.0
            
            normalized_data = (data - d_min) / d_range
            context.metadata['normalization'] = {
                'method': 'minmax',
                'min': d_min.tolist() if isinstance(d_min, np.ndarray) else d_min,
                'max': d_max.tolist() if isinstance(d_max, np.ndarray) else d_max
            }
            
        context.data = normalized_data
        return context
