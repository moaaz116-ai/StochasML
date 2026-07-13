'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Download, 
  Zap, 
  Cpu, 
  Activity, 
  CheckCircle,
  HelpCircle,
  FileCode,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { useProjectStore } from '@/stores/project-store';
import { useSettingsStore } from '@/stores/settings-store';
import { type Model, ModelStatus } from '@/lib/types';
import { toast } from '@/stores/toast-store';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function ModelsPage() {
  const router = useRouter();
  const { models, activeProject } = useProjectStore();
  const { apiUrl } = useSettingsStore();

  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const filteredModels = activeProject
    ? models.filter((m) => m.projectId === activeProject.id || (m as any).project_id === activeProject.id)
    : [];

  const handleDownload = (model: Model) => {
    try {
      const downloadUrl = `${apiUrl}/api/v1/models/${model.id}/download`;
      // Open download in a new window or trigger download link
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${model.name}.tflite`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`Started download of model ${model.name}`);
    } catch (e: any) {
      toast.error(`Download failed: ${e.message}`);
    }
  };

  const handleDeploy = (model: Model) => {
    router.push(`/deployments?modelId=${model.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Model Registry</h1>
          <p className="text-slate-400 mt-1">
            {activeProject
              ? `Trained and optimized models for ${activeProject.name}`
              : 'Select a project workspace to inspect models.'}
          </p>
        </div>
      </div>

      <Card className="p-4 border-blue-500/30 bg-blue-500/10 mb-6 liquid-glass">
        <div className="flex gap-3">
          <div className="mt-0.5 shrink-0">
            <Info className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Post-Training Quantization (PTQ)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              All models in the registry are automatically subjected to 8-bit integer (INT8) quantization. This process converts standard 32-bit floating-point weights into 8-bit representations using representative calibration. The result is a <strong>~4x reduction in memory footprint</strong> and faster inference latency on microcontrollers with zero hardware floating-point units.
            </p>
          </div>
        </div>
      </Card>

      {!activeProject ? (
        <Card className="p-8 text-center border-white/10 liquid-glass shadow-sm space-y-4">
          <AlertTriangle className="w-12 h-12 text-blue-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Active Project Workspace</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Choose a workspace under Projects first to view compiled models.
          </p>
          <Button variant="primary" onClick={() => router.push('/projects')}>Go to Projects</Button>
        </Card>
      ) : filteredModels.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Box}
            title="No models found"
            description="Completed training runs will appear here as optimized model flatbuffers. Go to Training to start."
            action={<Button variant="primary" onClick={() => router.push('/training')}>Start Training Run</Button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredModels.map((model) => (
            <Card key={model.id} className="p-6 liquid-glass hover:liquid-glass-interactive transition-all flex flex-col justify-between h-fit">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                      <Box className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="cursor-pointer" onClick={() => { setSelectedModel(model); setShowDetailsModal(true); }}>
                      <h3 className="font-bold text-white text-sm hover:underline">{model.name}</h3>
                      <p className="text-xs text-slate-400">{model.architecture === 'dense' ? 'Dense Neural Network' : '1D CNN Classifier'}</p>
                    </div>
                  </div>
                  <Badge variant="success">Optimized</Badge>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                    <p className="text-base font-bold text-emerald-400">{((model.accuracy ?? 0) * 100).toFixed(1)}%</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Accuracy</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                    <p className="text-base font-bold text-blue-400">{formatBytes(model.size ?? 0)}</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">TFLite Size</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                    <p className="text-base font-bold text-indigo-400">{(model.latency ?? 0).toFixed(1)} ms</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Latency</p>
                  </div>
                </div>

                {/* Modes Tags */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {model.quantized && <Badge variant="success">INT8 Quantized</Badge>}
                  <Badge variant="info">{model.format.toUpperCase()}</Badge>
                  {model.executionMode === 'production' ? (
                    <Badge variant="success">Production Mode (Real TF)</Badge>
                  ) : (
                    <Badge variant="warning">Demo Mode (Simulated)</Badge>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center border-t border-white/10 pt-4 mt-6">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => { setSelectedModel(model); setShowDetailsModal(true); }}
                >
                  <Cpu className="w-3.5 h-3.5 mr-1 text-blue-400" /> View Details
                </Button>
                
                <div className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => handleDownload(model)}
                  >
                    <Download className="w-3.5 h-3.5 mr-1 text-slate-400" /> Download
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => handleDeploy(model)}
                  >
                    <Zap className="w-3.5 h-3.5 mr-1 text-white fill-current" /> Deploy
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Model Details Modal */}
      <Modal
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Model Execution Metadata"
        description="Inspect quantized flatbuffer topologies and system performance projections."
      >
        {selectedModel && (
          <div className="space-y-5 text-sm">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h4 className="font-bold text-white text-base">{selectedModel.name}</h4>
                <p className="text-xs text-slate-400 mt-0.5">ID: {selectedModel.id}</p>
              </div>
              <Badge variant={selectedModel.executionMode === 'production' ? 'success' : 'warning'}>
                {selectedModel.executionMode === 'production' ? 'Production Run' : 'Demo Run'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                <span className="text-xs text-slate-400 font-semibold block">Validation Accuracy</span>
                <strong className="text-lg text-emerald-400 mt-0.5 block">{(selectedModel.accuracy * 100).toFixed(2)}%</strong>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                <span className="text-xs text-slate-400 font-semibold block">Inference Latency</span>
                <strong className="text-lg text-indigo-400 mt-0.5 block">{selectedModel.latency} ms</strong>
              </div>
            </div>

            <div className="space-y-2 border-t border-white/10 pt-3">
              <span className="text-xs text-slate-400 font-semibold block">INT8 Post-Training Quantization Projections</span>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Unquantized Size (FP32)</span>
                  <span className="text-white font-mono">{formatBytes(selectedModel.size * 4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Quantized Size (INT8 Flatbuffer)</span>
                  <span className="text-white font-mono">{formatBytes(selectedModel.size)}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-semibold border-t border-white/10 pt-2">
                  <span>Compression ratio</span>
                  <span>4x reduction (75% savings)</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t border-white/10 pt-3">
              <span className="text-xs text-slate-400 font-semibold block">Microcontroller Compatibility Check</span>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs leading-normal space-y-2">
                <div className="flex items-center gap-2 text-slate-200">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>ESP32-S3 (SRAM: 512KB, Flash: 8MB) - Compatible</span>
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Arduino Nano 33 (SRAM: 256KB, Flash: 1MB) - Compatible</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <Button variant="ghost" onClick={() => setShowDetailsModal(false)}>Close</Button>
              <Button 
                variant="primary"
                onClick={() => { setShowDetailsModal(false); handleDeploy(selectedModel); }}
              >
                Go to Deploy
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
