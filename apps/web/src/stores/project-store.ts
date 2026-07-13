import { create } from 'zustand';
import { Project, Dataset, Model, Deployment, DataType } from '@/lib/types';
import { api } from '@/services/api';

interface ProjectState {
  activeProject: Project | null;
  projects: Project[];
  datasets: Dataset[];
  models: Model[];
  deployments: Deployment[];
  setActiveProject: (project: Project | null) => void;
  fetchProjects: () => Promise<void>;
  fetchDatasets: (projectId: string) => Promise<void>;
  fetchModels: (projectId: string) => Promise<void>;
  fetchDeployments: (projectId: string) => Promise<void>;
  createProject: (data: Partial<Project>) => Promise<Project | null>;
  updateProject: (id: string, data: Partial<Project>) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;
  createDataset: (name: string, description: string, projectId: string, labels: { name: string; color: string }[]) => Promise<Dataset | null>;
  addModel: (model: Model) => void;
  addDeployment: (deployment: Deployment) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  activeProject: null,
  projects: [],
  datasets: [],
  models: [],
  deployments: [],
  
  setActiveProject: (project) => set({ activeProject: project }),

  addModel: (model) =>
    set((state) => ({ models: [...state.models, model] })),

  addDeployment: (deployment) =>
    set((state) => ({ deployments: [...state.deployments, deployment] })),

  fetchProjects: async () => {
    try {
      const projects = await api.getProjects();
      if (Array.isArray(projects)) {
        set({ projects });
        // Set the active project to the first project if none is active
        const currentActive = get().activeProject;
        if (projects.length > 0 && (!currentActive || !projects.some(p => p.id === currentActive.id))) {
          set({ activeProject: projects[0] });
        }
      }
    } catch (e) {
      console.error('Failed to fetch projects', e);
    }
  },

  fetchDatasets: async (projectId) => {
    try {
      const datasets = await api.getDatasets(projectId);
      if (Array.isArray(datasets)) {
        set({ datasets });
      }
    } catch (e) {
      console.error(`Failed to fetch datasets for project ${projectId}`, e);
    }
  },

  fetchModels: async (projectId) => {
    try {
      const models = await api.getModels(projectId);
      if (Array.isArray(models)) {
        set({ models });
      }
    } catch (e) {
      console.error(`Failed to fetch models for project ${projectId}`, e);
    }
  },

  fetchDeployments: async (projectId) => {
    try {
      const deployments = await api.getDeployments(projectId);
      if (Array.isArray(deployments)) {
        set({ deployments });
      }
    } catch (e) {
      console.error(`Failed to fetch deployments for project ${projectId}`, e);
    }
  },

  createProject: async (projectData) => {
    try {
      const payload: Partial<Project> = {
        dataType: DataType.SENSOR,
        datasetCount: 0,
        modelCount: 0,
        deploymentCount: 0,
        ...projectData,
      };
      const newProject = await api.createProject(payload);
      if (newProject && newProject.id) {
        set((state) => ({ 
          projects: [...state.projects, newProject],
          activeProject: state.activeProject ? state.activeProject : newProject
        }));
        return newProject;
      }
      return null;
    } catch (e) {
      console.error('Failed to create project', e);
      throw e;
    }
  },

  updateProject: async (id, projectData) => {
    try {
      const updated = await api.updateProject(id, projectData);
      if (updated && updated.id) {
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? updated : p)),
          activeProject: state.activeProject?.id === id ? updated : state.activeProject
        }));
        return updated;
      }
      return null;
    } catch (e) {
      console.error('Failed to update project', e);
      throw e;
    }
  },

  deleteProject: async (id) => {
    try {
      await api.deleteProject(id);
      set((state) => {
        const remaining = state.projects.filter((p) => p.id !== id);
        return {
          projects: remaining,
          activeProject: state.activeProject?.id === id ? (remaining[0] || null) : state.activeProject
        };
      });
      return true;
    } catch (e) {
      console.error('Failed to delete project', e);
      throw e;
    }
  },

  createDataset: async (name, description, projectId, labels) => {
    try {
      const newDataset = await api.createDataset({
        project_id: projectId,
        name,
        description,
        data_type: 'sensor',
        labels: labels,
      });
      if (newDataset && newDataset.id) {
        set((state) => ({ datasets: [...state.datasets, newDataset] }));
        return newDataset;
      }
      return null;
    } catch (e) {
      console.error('Failed to create dataset', e);
      throw e;
    }
  }
}));
