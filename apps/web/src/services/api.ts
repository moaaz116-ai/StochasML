import { API_URL } from '@/lib/constants';
import { Project, Dataset, Experiment, Model, Deployment, ApiResponse, PaginatedResponse } from '@/lib/types';

function normalizeProject(p: any): Project {
  if (!p) return p;
  return {
    ...p,
    id: p.id,
    name: p.name,
    description: p.description || '',
    dataType: p.dataType || p.data_type || 'sensor',
    createdAt: p.createdAt || p.created_at || new Date().toISOString(),
    updatedAt: p.updatedAt || p.updated_at || new Date().toISOString(),
    datasetCount: p.datasetCount ?? p.dataset_count ?? 0,
    modelCount: p.modelCount ?? p.model_count ?? 0,
    deploymentCount: p.deploymentCount ?? p.deployment_count ?? 0,
    targetBoard: p.targetBoard || p.target_board || 'esp32-s3',
    sampleRate: p.sampleRate ?? p.sample_rate ?? 50,
    channelCount: p.channelCount ?? p.channel_count ?? 3,
    channelNames: p.channelNames || p.channel_names || ['accel_x', 'accel_y', 'accel_z'],
    impulseConfig: p.impulseConfig || p.impulse_config,
  };
}

function normalizeDataset(d: any): Dataset {
  if (!d) return d;
  return {
    ...d,
    id: d.id,
    projectId: d.projectId || d.project_id,
    name: d.name,
    description: d.description || '',
    dataType: d.dataType || d.data_type || 'sensor',
    sampleCount: d.sampleCount ?? d.sample_count ?? 0,
    labelCount: d.labelCount ?? d.label_count ?? (d.labels ? d.labels.length : 0),
    totalSize: d.totalSize ?? d.total_size_bytes ?? 0,
    createdAt: d.createdAt || d.created_at || new Date().toISOString(),
    updatedAt: d.updatedAt || d.updated_at || new Date().toISOString(),
    labels: d.labels || [],
  };
}

/**
 * Core API Service for communicating with the FastAPI backend.
 * Provides typed methods for all Stochas ML endpoints.
 */
class ApiService {
  private baseUrl = `${API_URL}/api/v1`;

  public setBaseUrl(url: string) {
    this.baseUrl = `${url}/api/v1`;
  }

  /**
   * Internal wrapper for the Fetch API that handles headers and error unwrapping.
   * @param endpoint The API route starting with a slash
   * @param options Fetch options
   * @returns The JSON parsed response body
   */
  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    // In a real app, we'd add auth headers here
    const headers = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Parse error response if possible
      let errorMessage = `${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        // FastAPI returns errors in 'detail', others in 'message'
        const detail = errorData.detail || errorData.message;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (typeof detail === 'object' && detail !== null) {
          errorMessage = JSON.stringify(detail);
        }
      } catch {
        // Fallback to status text already set
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // --- System ---
  async getHealth(): Promise<{ status: string, version: string, execution_mode?: string }> {
    return this.fetch<{ status: string, version: string, execution_mode?: string }>('/health');
  }

  // --- Projects ---
  async getProjects(): Promise<Project[]> {
    const list = await this.fetch<any[]>('/projects');
    return Array.isArray(list) ? list.map(normalizeProject) : [];
  }

  async getProject(id: string): Promise<Project> {
    const p = await this.fetch<any>(`/projects/${id}`);
    return normalizeProject(p);
  }

  async createProject(data: Partial<Project>): Promise<Project> {
    const p = await this.fetch<any>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return normalizeProject(p);
  }

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const p = await this.fetch<any>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return normalizeProject(p);
  }

  async deleteProject(id: string): Promise<any> {
    return this.fetch<any>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Datasets ---
  async getDatasets(projectId: string): Promise<Dataset[]> {
    const list = await this.fetch<any[]>(`/datasets/${projectId}/datasets`);
    return Array.isArray(list) ? list.map(normalizeDataset) : [];
  }

  async getDataset(datasetId: string): Promise<Dataset> {
    const d = await this.fetch<any>(`/datasets/detail/${datasetId}`);
    return normalizeDataset(d);
  }

  async createDataset(data: { project_id: string; name: string; description: string; data_type: string; labels: { name: string; color: string }[] }): Promise<Dataset> {
    const d = await this.fetch<any>('/datasets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return normalizeDataset(d);
  }

  async addSample(datasetId: string, data: any): Promise<any> {
    const formData = new FormData();
    formData.append('label', data.label_id || 'unlabeled');
    
    // Create a Blob from the JSON payload array
    const blob = new Blob([JSON.stringify(data.payload)], { type: 'application/json' });
    formData.append('file', blob, 'sample.json');
    if (data.metadata) {
      formData.append('metadata_json', JSON.stringify(data.metadata));
    }

    // We don't set Content-Type header so browser can set boundary automatically
    const response = await fetch(`${this.baseUrl}/datasets/${datasetId}/samples`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
        throw new Error(response.statusText);
    }
    return response.json();
  }

  async getSamples(datasetId: string): Promise<any[]> {
    return this.fetch<any[]>(`/datasets/${datasetId}/samples`);
  }

  async getSample(sampleId: string): Promise<any> {
    return this.fetch<any>(`/datasets/samples/${sampleId}`);
  }

  async updateSample(sampleId: string, updateData: any): Promise<any> {
    return this.fetch<any>(`/datasets/samples/${sampleId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }

  async deleteSample(sampleId: string): Promise<any> {
    return this.fetch<any>(`/datasets/samples/${sampleId}`, {
      method: 'DELETE'
    });
  }

  async updateDatasetLabels(datasetId: string, labels: any[]): Promise<any> {
    return this.fetch<any>(`/datasets/${datasetId}/labels`, {
      method: 'PUT',
      body: JSON.stringify({ labels })
    });
  }

  async rebalanceDatasetSplit(datasetId: string, trainRatio = 0.8): Promise<any> {
    return this.fetch<any>(`/datasets/${datasetId}/rebalance_split`, {
      method: 'POST',
      body: JSON.stringify({ trainRatio })
    });
  }

  // --- Training/Experiments ---
  async startTraining(projectId: string, datasetIds: string[], config: any): Promise<any> {
    return this.fetch<any>(`/training/${projectId}/train`, {
      method: 'POST',
      body: JSON.stringify({
        project_id: projectId,
        dataset_ids: datasetIds,
        ...config
      }),
    });
  }

  async getTrainingStatus(experimentId: string): Promise<any> {
    return this.fetch<any>(`/training/${experimentId}/status`);
  }

  async cancelTraining(experimentId: string): Promise<any> {
    return this.fetch<any>(`/training/${experimentId}/cancel`, {
      method: 'POST',
    });
  }

  // --- Models ---
  async getModels(projectId: string): Promise<Model[]> {
    return this.fetch<Model[]>(`/models?project_id=${projectId}`);
  }

  // --- Deployments ---
  async getDeployments(projectId: string): Promise<Deployment[]> {
    return this.fetch<Deployment[]>(`/deployments?project_id=${projectId}`);
  }

  async createDeployment(data: { modelId: string; projectId: string; target: string }): Promise<Deployment> {
    return this.fetch<Deployment>('/deployments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDeploymentFiles(deploymentId: string): Promise<Record<string, string>> {
    return this.fetch<Record<string, string>>(`/deployments/${deploymentId}/files`);
  }

  // --- Model Testing ---
  async testModel(modelId: string, optionsOrDataset: any, confidenceThreshold?: number): Promise<any> {
    const payload = typeof optionsOrDataset === 'string'
      ? { datasetId: optionsOrDataset, confidenceThreshold: confidenceThreshold ?? 0.7 }
      : optionsOrDataset;
    const response = await fetch(`${this.baseUrl}/models/${modelId}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(err.detail || 'Test request failed');
    }
    return response.json();
  }

  // --- Live Inference ---
  async inferModel(modelId: string, windowData: number[][] | { window: number[][] }): Promise<any> {
    const payload = Array.isArray(windowData) ? { window: windowData } : windowData;
    const response = await fetch(`${this.baseUrl}/models/${modelId}/infer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(err.detail || 'Inference request failed');
    }
    return response.json();
  }

  async saveSampleFromCapture(datasetId: string, label: string, data: number[][], metadata: Record<string, unknown>, split = 'test'): Promise<any> {
    const response = await fetch(`${this.baseUrl}/datasets/${datasetId}/samples`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, data, metadata, split }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(err.detail || 'Save capture failed');
    }
    return response.json();
  }
}

export const api = new ApiService();
