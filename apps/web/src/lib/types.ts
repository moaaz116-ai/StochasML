// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export enum ModelStatus {
  DRAFT = 'draft',
  TRAINING = 'training',
  TRAINED = 'trained',
  OPTIMIZING = 'optimizing',
  OPTIMIZED = 'optimized',
  DEPLOYING = 'deploying',
  DEPLOYED = 'deployed',
  FAILED = 'failed',
}

export enum DataType {
  AUDIO = 'audio',
  IMAGE = 'image',
  SENSOR = 'sensor',
  CUSTOM = 'custom',
}

export enum DeploymentTarget {
  ESP32_S3 = 'esp32-s3',
  ESP32 = 'esp32',
  ARDUINO_NANO_33 = 'arduino-nano-33',
  RASPBERRY_PI_PICO = 'raspberry-pi-pico',
  GENERIC = 'generic',
}

// ---------------------------------------------------------------------------
// Core Interfaces
// ---------------------------------------------------------------------------

export interface Project {
  id: string;
  name: string;
  description: string;
  dataType: DataType;
  createdAt: string;
  updatedAt: string;
  datasetCount: number;
  modelCount: number;
  deploymentCount: number;
  targetBoard?: string;
  sampleRate?: number;
  channelCount?: number;
  channelNames?: string[];
  archived?: boolean;
  impulseConfig?: string;
}

export interface ImpulseConfig {
  windowSizeMs: number;
  windowStrideMs: number;
  sampleRateHz: number;
  selectedFeatures: string[];
  normalization: 'none' | 'zscore' | 'minmax';
  learningBlock: 'dense' | 'cnn_1d';
  zeroPadding: boolean;
}

export interface Dataset {
  id: string;
  projectId: string;
  name: string;
  description: string;
  dataType: DataType;
  sampleCount: number;
  labelCount: number;
  totalSize: number;
  createdAt: string;
  updatedAt: string;
  labels: Label[];
}

export interface Sample {
  id: string;
  datasetId: string;
  filename: string;
  label: string;
  size: number;
  duration?: number;
  width?: number;
  height?: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  sampleCount: number;
}

export interface Experiment {
  id: string;
  projectId: string;
  name: string;
  status: ModelStatus;
  architecture: string;
  config: TrainingConfig;
  metrics: TrainingMetrics;
  createdAt: string;
  completedAt?: string;
}

export interface Model {
  id: string;
  projectId: string;
  experimentId: string;
  name: string;
  status: 'draft' | 'training' | 'optimized' | 'failed';
  accuracy: number;
  size: number; // in bytes
  latency: number; // in ms
  architecture: string;
  format: 'keras' | 'tflite' | 'cc';
  quantized: boolean;
  createdAt: string;
  executionMode?: string;
}

export interface Deployment {
  id: string;
  modelId: string;
  projectId: string;
  target: DeploymentTarget;
  status: 'pending' | 'building' | 'ready' | 'failed';
  firmwareUrl?: string;
  createdAt: string;
  completedAt?: string;
}

export interface QualityReport {
  id: string;
  datasetId: string;
  overallScore: number;
  checks: QualityCheck[];
  createdAt: string;
}

export interface QualityCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  score: number;
  message: string;
  details?: Record<string, unknown>;
}

export interface ResourceEstimate {
  flashKb: number;
  ramKb: number;
  latencyMs: number;
  powerMw: number;
}

export interface BoardSpec {
  name: string;
  target: DeploymentTarget;
  flashKb: number;
  ramKb: number;
  clockMhz: number;
  features: string[];
}

// ---------------------------------------------------------------------------
// Training Configuration
// ---------------------------------------------------------------------------

export interface TrainingConfig {
  datasetId: string;
  architecture: string;
  hyperParameters: HyperParameters;
  augmentation: AugmentationConfig;
  targetDevice?: DeploymentTarget;
}

export interface HyperParameters {
  epochs: number;
  batchSize: number;
  learningRate: number;
  optimizer: string;
  scheduler: string;
  earlyStopping: boolean;
  patience: number;
}

export interface AugmentationConfig {
  enabled: boolean;
  techniques: string[];
  intensity: number;
}

export interface TrainingMetrics {
  accuracy: number;
  loss: number;
  valAccuracy: number;
  valLoss: number;
  epochs: number;
  trainingTime: number;
  history: EpochMetrics[];
}

export interface EpochMetrics {
  epoch: number;
  accuracy: number;
  loss: number;
  valAccuracy: number;
  valLoss: number;
  learningRate: number;
}

// ---------------------------------------------------------------------------
// Device & Serial
// ---------------------------------------------------------------------------

export interface SerialDeviceInfo {
  port: string;
  baudRate: number;
  chipId: string;
  firmware: string;
}

// ---------------------------------------------------------------------------
// API Response Types
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, unknown>;
}
