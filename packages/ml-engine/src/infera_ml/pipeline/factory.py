from typing import Any
from .interfaces import TrainerInterface, QuantizerInterface
from .trainer import MockModelTrainer
from .quantizer import MockTFLiteQuantizer
from .tf_trainer import TFModelTrainer
from .tf_quantizer import TFTFLiteQuantizer

class PipelineFactory:
    @staticmethod
    def get_trainer(mode: str, model_builder: Any, hyperparams: dict) -> TrainerInterface:
        if mode == "production":
            return TFModelTrainer(model_builder, hyperparams)
        return MockModelTrainer(model_builder, hyperparams)
        
    @staticmethod
    def get_quantizer(mode: str, keras_model_path: str) -> QuantizerInterface:
        if mode == "production":
            return TFTFLiteQuantizer(keras_model_path)
        return MockTFLiteQuantizer(keras_model_path)
