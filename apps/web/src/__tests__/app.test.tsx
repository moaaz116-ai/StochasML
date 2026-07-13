import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '@/services/api';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('Infera End-to-End API & Workflow Tests', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('1. Dataset Explorer Detail & Sample Operations', () => {
    it('should fetch dataset detail directly via api.getDataset(datasetId)', async () => {
      const dsPayload = { id: 'ds-123', name: 'Motion Test', data_type: 'accelerometer' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => dsPayload,
      });

      const result = await api.getDataset('ds-123');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/datasets/detail/ds-123'),
        expect.any(Object)
      );
      expect(result.name).toBe('Motion Test');
    });

    it('should fetch samples and detailed sample preview payload via api.getSample(sampleId)', async () => {
      const detailedSample = {
        id: 'sample-1',
        label: 'idle',
        split: 'train',
        duration: 1000,
        payload: [[0.1, 0.2, 0.3], [0.11, 0.21, 0.31]]
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => detailedSample,
      });

      const res = await api.getSample('sample-1');
      expect(res.id).toBe('sample-1');
      expect(res.payload).toHaveLength(2);
    });

    it('should toggle sample split between train and test', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 's-1', split: 'test' }),
      });

      const res = await api.updateSample('s-1', { split: 'test' });
      expect(res.split).toBe('test');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/datasets/samples/s-1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ split: 'test' })
        })
      );
    });

    it('should delete sample cleanly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'deleted' }),
      });

      await api.deleteSample('s-1');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/datasets/samples/s-1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('2. Canonical Impulse Schema Handoff', () => {
    it('should submit canonical impulse parameters for training', async () => {
      const canonicalConfig = {
        windowSizeMs: 1000,
        windowStrideMs: 200,
        sampleRateHz: 50,
        selectedFeatures: ['rms', 'zcr'],
        normalization: 'zscore',
        learningBlock: 'DenseClassifier',
        zeroPadding: true
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ job_id: 'job-100', status: 'QUEUED' }),
      });

      const job = await api.startTraining('proj-1', ['ds-1'], {
        architecture: 'DenseClassifier',
        hyperparameters: { epochs: 20 },
        impulse_config: canonicalConfig
      });

      expect(job.job_id).toBe('job-100');
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.impulse_config).toEqual(canonicalConfig);
      expect(body.impulse_config.windowSizeMs).toBe(1000);
      expect(body.impulse_config.selectedFeatures).toContain('rms');
    });
  });

  describe('3. Model Testing & Live Classification Paths', () => {
    it('should handle model testing error states when dataset is invalid', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
        json: async () => ({ detail: 'No valid test samples found' }),
      });

      await expect(api.testModel('m-1', 'ds-bad', 0.7)).rejects.toThrow();
    });

    it('should infer real hardware window during Live Classification', async () => {
      const windowData = [[0.01, 0.02, 0.03], [0.02, 0.03, 0.04]];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ label: 'active', confidence: 0.94 }),
      });

      const pred = await api.inferModel('model-prod', windowData);
      expect(pred.label).toBe('active');
      expect(pred.confidence).toBe(0.94);
    });
  });
});
