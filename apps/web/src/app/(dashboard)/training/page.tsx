'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  BrainCircuit, 
  Play, 
  Database, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  Terminal,
  XCircle,
  AlertCircle,
  FileCode
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';
import { useProjectStore } from '@/stores/project-store';
import { toast } from '@/stores/toast-store';

function TrainingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetDatasetId = searchParams.get('datasetId');

  const { activeProject, datasets, fetchModels } = useProjectStore();

  const projectDatasets = activeProject
    ? datasets.filter((d) => d.projectId === activeProject.id || (d as any).project_id === activeProject.id)
    : [];

  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  
  // Hyperparameters
  const [learningRate, setLearningRate] = useState('0.001');
  const [epochs, setEpochs] = useState('10');
  const [batchSize, setBatchSize] = useState('32');
  const [architecture, setArchitecture] = useState('dense');

  // Job States
  const [isTraining, setIsTraining] = useState(false);
  const [executionMode, setExecutionMode] = useState<string>('demo');
  const [experimentId, setExperimentId] = useState<string | null>(null);
  const [trainingStatus, setTrainingStatus] = useState<string>('idle');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<{ accuracy: number; loss: number; size: number } | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Default selection
  useEffect(() => {
    if (presetDatasetId) {
      setSelectedDatasetId(presetDatasetId);
    } else if (projectDatasets.length > 0 && !selectedDatasetId) {
      setSelectedDatasetId(projectDatasets[0].id);
    }
  }, [presetDatasetId, projectDatasets, selectedDatasetId]);

  const selectedDataset = datasets.find((d) => d.id === selectedDatasetId);

  // Fetch execution mode on load
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const health = await api.getHealth();
        if (health.execution_mode) {
          setExecutionMode(health.execution_mode);
        }
      } catch (e) {
        console.error('Failed to fetch health info', e);
      }
    };
    fetchHealth();
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const startPolling = (jobId: string) => {
    stopPolling();
    setElapsedTime(0);
    setLogs(['[SYSTEM] Training job submitted to backend. Queue status: PENDING.']);

    // Timer Interval
    timerIntervalRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    // Status polling
    pollIntervalRef.current = setInterval(async () => {
      try {
        const statusData = await api.getTrainingStatus(jobId);
        const status = statusData.status;
        setTrainingStatus(status);
        
        if (statusData.logs && statusData.logs.length > 0) {
          setLogs(['[SYSTEM] Training job submitted to backend. Queue status: PENDING.', ...statusData.logs]);
        }
        
        if (status === 'completed') {
          stopPolling();
          setIsTraining(false);
          
          if (statusData.metrics) {
            setMetrics({
              accuracy: statusData.metrics.accuracy || 0,
              loss: statusData.metrics.loss || 0,
              size: statusData.metrics.tflite_size_bytes || (architecture === 'dense' ? 12340 : 42150)
            });
          }
          
          toast.success('Model training completed successfully!');
          if (activeProject) fetchModels(activeProject.id);
        } else if (status === 'failed') {
          stopPolling();
          setIsTraining(false);
          toast.error('Training job failed.');
        }

      } catch (e: any) {
        console.error('Polling error', e);
      }
    }, 1000);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const handleStartTraining = async () => {
    if (!activeProject || !selectedDataset) return;

    // Validate hyperparameters
    const lr = parseFloat(learningRate);
    const ep = parseInt(epochs, 10);
    const bs = parseInt(batchSize, 10);

    if (isNaN(lr) || lr < 0.0001 || lr > 0.1) {
      toast.error('Learning rate must be between 0.0001 and 0.1.');
      return;
    }
    if (isNaN(ep) || ep < 1 || ep > 500) {
      toast.error('Epochs must be between 1 and 500.');
      return;
    }
    if (isNaN(bs) || bs < 4 || bs > 256) {
      toast.error('Batch size must be between 4 and 256.');
      return;
    }

    // Validate architecture compatibility
    if (architecture === 'cnn_2d' && activeProject.dataType !== 'image') {
      toast.error('2D CNN architecture is only compatible with image datasets.');
      return;
    }

    // Parse impulse config if available
    let impulseConfig: any = null;
    if (activeProject.impulseConfig) {
      try {
        impulseConfig = typeof activeProject.impulseConfig === 'string'
          ? JSON.parse(activeProject.impulseConfig)
          : activeProject.impulseConfig;
      } catch {
        // Ignore parse errors
      }
    }

    if (!impulseConfig) {
      toast.info('No impulse configuration found. Training will use default signal processing settings. Configure one under Impulse Design for better results.');
    }

    try {
      setIsTraining(true);
      setTrainingStatus('queued');
      setMetrics(null);
      
      const config = {
        architecture,
        hyperparameters: {
          learning_rate: lr,
          epochs: ep,
          batch_size: bs,
        },
        ...(impulseConfig && { impulse_config: impulseConfig }),
      };

      const res = await api.startTraining(activeProject.id, [selectedDataset.id], config);
      setExperimentId(res.experiment_id);
      startPolling(res.experiment_id);
      toast.success('Training job enqueued successfully.');
    } catch (error: any) {
      toast.error(`Failed to start training: ${error.message}`);
      setIsTraining(false);
      setTrainingStatus('failed');
    }
  };

  const handleCancelTraining = async () => {
    if (!experimentId) return;
    try {
      await api.cancelTraining(experimentId);
      stopPolling();
      setIsTraining(false);
      setTrainingStatus('cancelled');
      setLogs((prev) => [...prev, '[SYSTEM] Job cancellation requested by user. Terminating process...', '[SYSTEM] Job cancelled.']);
      toast.info('Training job cancelled.');
    } catch (e: any) {
      toast.error(`Failed to cancel job: ${e.message}`);
    }
  };

  // Constraints verification
  const meetsConstraints = () => {
    if (!activeProject || !selectedDataset) return false;
    // Must have at least 2 labels
    if (selectedDataset.labels.length < 2) return false;
    // At least 5 samples per label
    const minSamples = 5;
    return selectedDataset.labels.every(l => l.sampleCount >= minSamples);
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Model Training</h1>
          <p className="text-slate-400 mt-1">Configure parameters, run model compilations, and review loss statistics.</p>
        </div>
      </div>

      {!activeProject ? (
        <Card className="p-8 text-center border-white/10 liquid-glass shadow-sm space-y-4">
          <AlertTriangle className="w-12 h-12 text-blue-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Active Project Selected</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Choose a workspace under Projects first to select training parameters.
          </p>
          <Button variant="primary" onClick={() => router.push('/projects')}>Go to Projects</Button>
        </Card>
      ) : projectDatasets.length === 0 ? (
        <Card className="p-8 text-center border-white/10 liquid-glass shadow-sm space-y-4">
          <Database className="w-12 h-12 text-blue-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Datasets Available</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Create a dataset and record or upload sample sensor streams to start model training.
          </p>
          <Button variant="primary" onClick={() => router.push('/datasets')}>Go to Datasets</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 border-white/10 liquid-glass">
              <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <BrainCircuit className="w-6 h-6 text-blue-400" />
                  <h2 className="text-xl font-bold text-white">Training Configurator</h2>
                </div>
                <Badge variant={executionMode === 'production' ? 'success' : 'warning'}>
                  {executionMode === 'production' ? '🧠 Production (TensorFlow)' : '⚡ Demo Mode (Virtual)'}
                </Badge>
              </div>

              {/* Warnings on constraints */}
              {selectedDataset && !meetsConstraints() && (
                <div className="bg-amber-500/15 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-200 leading-relaxed mb-6 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Insufficient training data</strong>: In order to train classification networks, Stochas ML requires at least <strong>2 labels</strong> and at least <strong>5 samples per label</strong>.
                    <div className="mt-1.5 font-semibold text-white">
                      Current stats: {selectedDataset.labels.length} labels ({selectedDataset.labels.map(l => `${l.sampleCount} ${l.name}`).join(', ') || 'no labels configured'})
                    </div>
                  </div>
                </div>
              )}

              {/* Impulse Config Summary */}
              {(() => {
                let impulse: any = null;
                if (activeProject?.impulseConfig) {
                  try {
                    impulse = typeof activeProject.impulseConfig === 'string'
                      ? JSON.parse(activeProject.impulseConfig)
                      : activeProject.impulseConfig;
                  } catch { /* ignore */ }
                }
                return impulse ? (
                  <div className="bg-blue-500/15 border border-blue-500/30 rounded-2xl p-4 text-xs text-blue-200 leading-relaxed mb-6 flex items-start gap-2.5">
                    <FileCode className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <strong>Active Impulse:</strong>{' '}
                      Window {impulse.windowSizeMs ?? impulse.windowSize ?? 1000}ms, Stride {impulse.windowStrideMs ?? impulse.stride ?? 200}ms,{' '}
                      Rate {impulse.sampleRateHz ?? 50}Hz,{' '}
                      Features: {(Array.isArray(impulse.selectedFeatures || impulse.features) ? (impulse.selectedFeatures || impulse.features).join(', ') : 'rms, zcr, peaks')},{' '}
                      Normalization: {impulse.normalization || 'none'},{' '}
                      Block: {impulse.learningBlock || architecture}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-slate-300 leading-relaxed mb-6 flex items-start gap-2.5">
                    <FileCode className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <strong>No Impulse Configured.</strong>{' '}
                      Training will use default signal processing.{' '}
                      <button onClick={() => router.push('/impulse')} className="text-blue-400 underline hover:text-blue-300">
                        Configure Impulse Design
                      </button>
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-300 font-semibold">Select dataset</label>
                    <select
                      value={selectedDatasetId}
                      onChange={(e) => setSelectedDatasetId(e.target.value)}
                      disabled={isTraining}
                      className="bg-[#0e1424] border border-white/20 rounded-xl p-2.5 text-sm text-white focus:outline-none w-full"
                    >
                      {projectDatasets.map((ds) => (
                        <option key={ds.id} value={ds.id}>{ds.name} ({ds.sampleCount} samples)</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-300 font-semibold">Architecture topology</label>
                    <select
                      value={architecture}
                      onChange={(e) => setArchitecture(e.target.value)}
                      disabled={isTraining}
                      className="bg-[#0e1424] border border-white/20 rounded-xl p-2.5 text-sm text-white focus:outline-none w-full"
                    >
                      <option value="dense">Dense Classifier (Small, Fast)</option>
                      <option value="cnn_1d">1D CNN (Optimal for Accelerometers)</option>
                      <option value="cnn_2d">2D CNN (Image Classifier)</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Hyperparameters</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      label="Learning Rate"
                      type="number"
                      step="0.0001"
                      value={learningRate}
                      onChange={(e) => setLearningRate(e.target.value)}
                      disabled={isTraining}
                    />
                    <Input
                      label="Epochs"
                      type="number"
                      value={epochs}
                      onChange={(e) => setEpochs(e.target.value)}
                      disabled={isTraining}
                    />
                    <Input
                      label="Batch Size"
                      type="number"
                      value={batchSize}
                      onChange={(e) => setBatchSize(e.target.value)}
                      disabled={isTraining}
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  {isTraining && (
                    <Button variant="danger" onClick={handleCancelTraining}>
                      <XCircle className="w-4 h-4 mr-2" /> Cancel Job
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    className="px-6"
                    onClick={handleStartTraining}
                    disabled={isTraining || !selectedDataset || !meetsConstraints()}
                  >
                    {isTraining ? 'Training active...' : 'Start Training Run'}
                    {!isTraining && <Play className="w-4 h-4 ml-2 fill-current" />}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Logging terminal */}
            {isTraining || logs.length > 0 ? (
              <Card className="p-6 border-white/10 liquid-glass space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-blue-400" /> Pipeline Compiler Console
                  </h3>
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Elapsed: {formatTime(elapsedTime)}
                    </span>
                    <Badge variant={
                      trainingStatus === 'completed' ? 'success' :
                      trainingStatus === 'failed' ? 'error' :
                      trainingStatus === 'cancelled' ? 'default' : 'warning'
                    }>
                      {trainingStatus}
                    </Badge>
                  </div>
                </div>

                <div className="h-60 bg-[#070b13] border border-white/10 rounded-2xl p-4 font-mono text-xs text-slate-300 overflow-y-auto space-y-1 shadow-inner">
                  {logs.map((log, index) => (
                    <div key={index} className="leading-relaxed">
                      {log}
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </Card>
            ) : null}
          </div>

          {/* Details Column */}
          <div className="space-y-6">
            {/* Selected Dataset Summary */}
            <Card className="p-5 space-y-4 liquid-glass">
              <h3 className="text-sm font-bold text-white border-b border-white/10 pb-2">Selected Dataset</h3>
              {selectedDataset ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-slate-400">Name</span>
                    <p className="font-bold text-white mt-0.5">{selectedDataset.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                      <span className="text-slate-400 block mb-0.5">Total Samples</span>
                      <strong className="text-base text-white">{selectedDataset.sampleCount}</strong>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                      <span className="text-slate-400 block mb-0.5">Classes</span>
                      <strong className="text-base text-white">{selectedDataset.labels.length}</strong>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-slate-400 block">Class breakdown</span>
                    <div className="space-y-1.5">
                      {selectedDataset.labels.map(l => (
                        <div key={l.id} className="flex justify-between items-center bg-white/5 border border-white/10 p-2 rounded-xl">
                          <span className="flex items-center gap-1.5 font-medium text-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: l.color }} />
                            {l.name}
                          </span>
                          <span className="font-bold text-white">{l.sampleCount} samples</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Choose a dataset configuration on left to load summary.</p>
              )}
            </Card>

            {/* Results summary panel */}
            {metrics && (
              <Card className="p-5 border-emerald-500/30 bg-emerald-500/10 space-y-4 backdrop-blur-xl">
                <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Training Results
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Validation Accuracy</span>
                    <strong className="text-emerald-400">{(metrics.accuracy * 100).toFixed(1)}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Validation Loss</span>
                    <strong className="text-white font-mono">{metrics.loss.toFixed(3)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Quantized Size (.tflite)</span>
                    <strong className="text-white font-mono">{(metrics.size / 1024).toFixed(2)} KB</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Execution Mode</span>
                    <strong className="text-white uppercase">{executionMode}</strong>
                  </div>
                </div>
                <div className="pt-2">
                  <Button 
                    variant="primary"
                    className="w-full text-xs flex items-center justify-center gap-1.5"
                    onClick={() => router.push('/models')}
                  >
                    <FileCode className="w-3.5 h-3.5" /> View Compiled Model
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrainingPage() {
  return (
    <Suspense fallback={
      <div className="h-40 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
        <BrainCircuit className="w-5 h-5 animate-spin text-blue-500" />
        Loading training suite...
      </div>
    }>
      <TrainingPageContent />
    </Suspense>
  );
}
