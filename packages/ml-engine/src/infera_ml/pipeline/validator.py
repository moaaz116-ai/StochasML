from .base import PipelineStage, PipelineContext, PipelineError
import numpy as np

class DataValidator(PipelineStage):
    def execute(self, context: PipelineContext) -> PipelineContext:
        data = context.data
        labels = context.labels
        
        if data is None or labels is None:
            raise PipelineError("Data or labels missing in context.")
            
        if not isinstance(data, np.ndarray):
            try:
                context.data = np.array(data)
            except Exception as e:
                raise PipelineError("Could not convert data to numpy array") from e
                
        if not isinstance(labels, np.ndarray):
            try:
                context.labels = np.array(labels)
            except Exception as e:
                raise PipelineError("Could not convert labels to numpy array") from e
                
        if len(context.data) != len(context.labels):
            raise PipelineError(f"Shape mismatch: data len {len(context.data)} != labels len {len(context.labels)}")
            
        if np.isnan(context.data).any() or np.isinf(context.data).any():
            raise PipelineError("Data contains NaN or Inf values")
            
        return context
