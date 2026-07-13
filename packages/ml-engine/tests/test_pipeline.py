import pytest
import numpy as np
from src.infera_ml.features.time_series import TimeSeriesFeatureExtractor
from src.infera_ml.models.dense import DenseClassifier

def test_time_series_features():
    extractor = TimeSeriesFeatureExtractor()
    # Mock data: 1 window, 10 steps, 3 channels
    data = np.random.rand(1, 10, 3).astype(np.float32)
    
    features = extractor.extract(data)
    
    # 3 channels * (mean, std, min, max, rms, energy, zcr, dom_freq) = 24 features
    assert features.shape == (1, 24)
    assert not np.isnan(features).any()

def test_dense_classifier_build():
    builder = DenseClassifier()
    model = builder.build(input_shape=(18,), num_classes=3)
    
    assert model.input_shape == (None, 18)
    assert model.output_shape == (None, 3)
    assert len(model.layers) == 5  # 3 Dense + 2 Dropout

def test_resource_estimation():
    builder = DenseClassifier()
    resources = builder.estimate_resources(input_shape=18, num_classes=3)
    
    assert 'flash_bytes' in resources
    assert 'ram_bytes' in resources
    assert resources['flash_bytes'] > 0
