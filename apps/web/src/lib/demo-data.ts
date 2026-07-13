import { Project, Dataset, Model, Deployment, DataType, ModelStatus, DeploymentTarget } from './types';

// ─── Seed Projects ───────────────────────────────────────────────────────────
export const DEMO_PROJECTS: Project[] = [
  {
    id: 'proj-accel',
    name: 'Accelerometer Gesture Recognition',
    description: 'Classify hand gestures using IMU sensor data from ESP32-S3.',
    dataType: DataType.SENSOR,
    createdAt: '2026-06-15T10:00:00Z',
    updatedAt: '2026-07-05T14:22:00Z',
    datasetCount: 2,
    modelCount: 1,
    deploymentCount: 1,
  },
  {
    id: 'proj-kws',
    name: 'Keyword Spotting',
    description: 'Detect wake-words and voice commands on-device.',
    dataType: DataType.AUDIO,
    createdAt: '2026-06-20T08:30:00Z',
    updatedAt: '2026-07-02T09:15:00Z',
    datasetCount: 1,
    modelCount: 0,
    deploymentCount: 0,
  },
  {
    id: 'proj-vww',
    name: 'Visual Wake Words',
    description: 'Detect person presence using a tiny camera module.',
    dataType: DataType.IMAGE,
    createdAt: '2026-07-01T12:00:00Z',
    updatedAt: '2026-07-06T16:45:00Z',
    datasetCount: 1,
    modelCount: 0,
    deploymentCount: 0,
  },
];

// ─── Seed Datasets ───────────────────────────────────────────────────────────
export const DEMO_DATASETS: Dataset[] = [
  {
    id: 'default-dataset-1',
    projectId: 'proj-accel',
    name: 'Dummy Accelerometer Data',
    description: 'Pre-loaded 3-axis sine wave dataset with idle/active classes.',
    dataType: DataType.SENSOR,
    sampleCount: 50,
    labelCount: 2,
    totalSize: 128000,
    createdAt: '2026-06-16T11:00:00Z',
    updatedAt: '2026-07-05T14:22:00Z',
    labels: [
      { id: 'lbl-1', name: 'idle', color: '#888888', sampleCount: 25 },
      { id: 'lbl-2', name: 'active', color: '#ff4444', sampleCount: 25 },
    ],
  },
  {
    id: 'ds-gestures',
    projectId: 'proj-accel',
    name: 'Gesture Recordings',
    description: 'Real accelerometer recordings of swipe, tap, and circle gestures.',
    dataType: DataType.SENSOR,
    sampleCount: 320,
    labelCount: 3,
    totalSize: 4500000,
    createdAt: '2026-06-28T14:30:00Z',
    updatedAt: '2026-07-03T18:00:00Z',
    labels: [
      { id: 'lbl-3', name: 'swipe', color: '#6366f1', sampleCount: 110 },
      { id: 'lbl-4', name: 'tap', color: '#22d3ee', sampleCount: 105 },
      { id: 'lbl-5', name: 'circle', color: '#f59e0b', sampleCount: 105 },
    ],
  },
  {
    id: 'ds-audio',
    projectId: 'proj-kws',
    name: 'Wake Word Audio',
    description: '"Hey Infera" keyword recordings, 1s clips at 16kHz.',
    dataType: DataType.AUDIO,
    sampleCount: 500,
    labelCount: 2,
    totalSize: 16000000,
    createdAt: '2026-06-22T09:00:00Z',
    updatedAt: '2026-07-01T12:00:00Z',
    labels: [
      { id: 'lbl-6', name: 'hey_infera', color: '#a855f7', sampleCount: 250 },
      { id: 'lbl-7', name: 'background', color: '#64748b', sampleCount: 250 },
    ],
  },
  {
    id: 'ds-vww',
    projectId: 'proj-vww',
    name: 'Person Detection Images',
    description: '96×96 grayscale images for visual wake word detection.',
    dataType: DataType.IMAGE,
    sampleCount: 1200,
    labelCount: 2,
    totalSize: 22000000,
    createdAt: '2026-07-01T12:30:00Z',
    updatedAt: '2026-07-06T16:45:00Z',
    labels: [
      { id: 'lbl-8', name: 'person', color: '#10b981', sampleCount: 600 },
      { id: 'lbl-9', name: 'no_person', color: '#ef4444', sampleCount: 600 },
    ],
  },
];

// ─── Seed Models ─────────────────────────────────────────────────────────────
export const DEMO_MODELS: Model[] = [
  {
    id: 'model-dense-v1',
    experimentId: 'exp-001',
    projectId: 'proj-accel',
    name: 'Dense Classifier v1',
    status: ModelStatus.OPTIMIZED,
    architecture: 'dense',
    accuracy: 0.965,
    size: 48128,
    latency: 3.2,
    format: 'tflite',
    quantized: true,
    createdAt: '2026-07-04T10:00:00Z',
  },
];

// ─── Seed Deployments ────────────────────────────────────────────────────────
export const DEMO_DEPLOYMENTS: Deployment[] = [
  {
    id: 'deploy-001',
    modelId: 'model-dense-v1',
    projectId: 'proj-accel',
    target: DeploymentTarget.ESP32_S3,
    status: 'ready',
    firmwareUrl: '/artifacts/firmware-v1.zip',
    createdAt: '2026-07-05T15:00:00Z',
    completedAt: '2026-07-05T15:02:30Z',
  },
];
