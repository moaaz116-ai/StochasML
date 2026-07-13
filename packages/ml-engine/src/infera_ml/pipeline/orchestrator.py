import logging
from typing import Callable
from .base import PipelineContext, PipelineStage, PipelineError

logger = logging.getLogger(__name__)

class PipelineOrchestrator:
    def __init__(self, stages: list[PipelineStage]):
        self.stages = stages

    def run(self, context: PipelineContext, progress_callback: Callable[[int, str], None] = None) -> PipelineContext:
        total_stages = len(self.stages)
        
        for idx, stage in enumerate(self.stages):
            stage_name = stage.name
            
            if progress_callback:
                progress_callback(int((idx / total_stages) * 100), f"Running {stage_name}")
                
            logger.info(f"Pipeline stage started: {stage_name}")
            
            try:
                stage.validate_input(context)
                context = stage.execute(context)
            except Exception as e:
                logger.error(f"Error in pipeline stage {stage_name}: {str(e)}")
                raise PipelineError(f"Stage {stage_name} failed: {str(e)}") from e
                
            logger.info(f"Pipeline stage completed: {stage_name}")
            
        if progress_callback:
            progress_callback(100, "Pipeline completed")
            
        return context
