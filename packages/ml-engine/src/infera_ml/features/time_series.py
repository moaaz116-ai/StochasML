from .base import FeatureExtractor
import numpy as np
from scipy.stats import skew, kurtosis

class TimeSeriesFeatureExtractor(FeatureExtractor):
    def __init__(self, channels=3):
        self.channels = channels
        self.feature_funcs = [
            ('rms', lambda x: np.sqrt(np.mean(np.square(x), axis=0))),
            ('mean', lambda x: np.mean(x, axis=0)),
            ('std', lambda x: np.std(x, axis=0)),
            ('min', lambda x: np.min(x, axis=0)),
            ('max', lambda x: np.max(x, axis=0)),
            ('skew', lambda x: skew(x, axis=0, bias=False)),
            ('kurtosis', lambda x: kurtosis(x, axis=0, bias=False)),
            ('zcr', self._zero_crossing_rate)
        ]
        
    def _zero_crossing_rate(self, x):
        # x is expected to be shape (window_length, channels)
        # return shape (channels,)
        diffs = np.diff(np.signbit(x).astype(int), axis=0)
        return np.sum(np.abs(diffs), axis=0) / (x.shape[0] - 1)

    def get_feature_names(self) -> list[str]:
        names = []
        for name, _ in self.feature_funcs:
            for ch in range(self.channels):
                names.append(f"{name}_ch{ch}")
        return names

    def get_output_shape(self) -> tuple:
        return (len(self.feature_funcs) * self.channels,)

    def extract(self, data: np.ndarray) -> np.ndarray:
        # data is expected to be shape (num_windows, window_length, channels)
        num_windows, window_length, channels = data.shape
        if channels != self.channels:
            raise ValueError(f"Expected {self.channels} channels, got {channels}")
            
        features = []
        for window in data:
            window_features = []
            for _, func in self.feature_funcs:
                # Apply func over window_length, resulting in (channels,)
                val = func(window)
                # Handle cases where scipy might return NaN for constant data
                val = np.nan_to_num(val)
                window_features.extend(val)
            features.append(window_features)
            
        return np.array(features)
        
    def generate_c_code(self) -> str:
        return """
// Auto-generated Time Series Feature Extractor
void extract_time_series_features(float* input_window, int window_length, int channels, float* output_features) {
    int out_idx = 0;
    for (int func_idx = 0; func_idx < 8; func_idx++) {
        for (int ch = 0; ch < channels; ch++) {
            float val = 0.0f;
            // Feature computation logic mapped from Python
            // 0: rms, 1: mean, 2: std, 3: min, 4: max, 5: skew, 6: kurtosis, 7: zcr
            // (Placeholder for actual C math implementation for numerical equivalence)
            output_features[out_idx++] = val;
        }
    }
}
"""
