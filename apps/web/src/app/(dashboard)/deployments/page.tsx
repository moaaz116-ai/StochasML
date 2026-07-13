'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Cpu, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Download, 
  Eye, 
  Copy,
  AlertTriangle,
  Info,
  Terminal
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { useProjectStore } from '@/stores/project-store';
import { useSettingsStore } from '@/stores/settings-store';
import { DeploymentTarget, type Deployment } from '@/lib/types';
import { api } from '@/services/api';
import { toast } from '@/stores/toast-store';

const statusConfig: Record<string, { variant: 'success' | 'warning' | 'info' | 'error'; label: string; icon: React.ElementType }> = {
  pending: { variant: 'warning', label: 'Queued', icon: Clock },
  building: { variant: 'info', label: 'Compiling', icon: Cpu },
  ready: { variant: 'success', label: 'Ready', icon: CheckCircle2 },
  failed: { variant: 'error', label: 'Failed', icon: Cpu },
};

const targetLabels: Record<string, string> = {
  [DeploymentTarget.ESP32_S3]: 'ESP32-S3 DevKit',
  [DeploymentTarget.ESP32]: 'ESP32 NodeMCU',
  [DeploymentTarget.ARDUINO_NANO_33]: 'Arduino Nano 33 BLE',
  [DeploymentTarget.RASPBERRY_PI_PICO]: 'Raspberry Pi Pico',
  [DeploymentTarget.GENERIC]: 'Generic C++ Lib',
};

function DeploymentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetModelId = searchParams.get('modelId');

  const { deployments, models, activeProject, fetchDeployments } = useProjectStore();
  const { apiUrl } = useSettingsStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedTarget, setSelectedTarget] = useState(DeploymentTarget.ESP32_S3);
  
  // File viewer state
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [viewingFiles, setViewingFiles] = useState<Record<string, string> | null>(null);
  const [activeFileTab, setActiveFileTab] = useState<string>('model.h');
  const [isFetchingFiles, setIsFetchingFiles] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const filteredDeployments = activeProject
    ? deployments.filter((d) => d.projectId === activeProject.id || (d as any).project_id === activeProject.id)
    : [];

  const projectModels = activeProject
    ? models.filter((m) => m.projectId === activeProject.id || (m as any).project_id === activeProject.id)
    : [];

  // Parse preset model ID from query params
  useEffect(() => {
    if (presetModelId && projectModels.some(m => m.id === presetModelId)) {
      setSelectedModel(presetModelId);
      setShowCreateModal(true);
    }
  }, [presetModelId, models]);

  // Status Polling for active build runs
  useEffect(() => {
    const hasActiveBuilds = filteredDeployments.some(
      (d) => d.status === 'pending' || d.status === 'building'
    );

    if (hasActiveBuilds) {
      if (!pollIntervalRef.current) {
        pollIntervalRef.current = setInterval(async () => {
          if (activeProject) {
            await fetchDeployments(activeProject.id);
          }
        }, 2000);
      }
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [filteredDeployments, activeProject]);

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const handleCreate = async () => {
    if (!selectedModel || !activeProject) {
      toast.error('Select an optimized model to deploy.');
      return;
    }
    
    try {
      await api.createDeployment({
        modelId: selectedModel,
        projectId: activeProject.id,
        target: selectedTarget,
      });
      toast.success('Firmware compile job enqueued.');
      await fetchDeployments(activeProject.id);
    } catch (e: any) {
      toast.error(`Deploy failed: ${e.message}`);
    } finally {
      setShowCreateModal(false);
      setSelectedModel('');
    }
  };

  const handleDownloadFirmware = (deploy: Deployment) => {
    try {
      const downloadUrl = `${apiUrl}/api/v1/deployments/${deploy.id}/download`;
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `firmware-${deploy.id.slice(0, 8)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Started downloading PlatformIO firmware bundle!');
    } catch (e: any) {
      toast.error(`Download failed: ${e.message}`);
    }
  };

  const handleViewFiles = async (deploy: Deployment) => {
    try {
      setIsFetchingFiles(true);
      setShowFilesModal(true);
      const files = await api.getDeploymentFiles(deploy.id);
      setViewingFiles(files);
      const keys = Object.keys(files);
      if (keys.length > 0) {
        setActiveFileTab(keys[0]);
      }
    } catch (e: any) {
      toast.error(`Failed to load deployment files: ${e.message}`);
      setShowFilesModal(false);
    } finally {
      setIsFetchingFiles(false);
    }
  };

  const handleCopyCode = () => {
    if (!viewingFiles || !viewingFiles[activeFileTab]) return;
    navigator.clipboard.writeText(viewingFiles[activeFileTab]);
    toast.success(`${activeFileTab} code copied to clipboard.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Firmware Deployments</h1>
          <p className="text-slate-400 mt-1">
            {activeProject
              ? `Compile and package embeddable C++ libraries for ${activeProject.name}`
              : 'Select a project workspace to build firmware packages.'}
          </p>
        </div>

        <Button 
          variant="primary"
          onClick={() => setShowCreateModal(true)} 
          disabled={!activeProject || projectModels.length === 0}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Deployment
        </Button>
      </div>

      {!activeProject ? (
        <Card className="p-8 text-center border-white/10 liquid-glass shadow-sm space-y-4">
          <AlertTriangle className="w-12 h-12 text-blue-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Active Project Workspace</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Choose a workspace under Projects first to manage deployment pipelines.
          </p>
          <Button variant="primary" onClick={() => router.push('/projects')}>Go to Projects</Button>
        </Card>
      ) : filteredDeployments.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Cpu}
            title="No deployments found"
            description={
              projectModels.length === 0 
                ? "First, you must train a classification model under the Training section." 
                : "Select a trained neural network and compile an optimized firmware bundle."
            }
            action={
              projectModels.length > 0 ? (
                <Button variant="primary" onClick={() => setShowCreateModal(true)}>Create Deployment</Button>
              ) : (
                <Button variant="primary" onClick={() => router.push('/training')}>Train Model</Button>
              )
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDeployments.map((deploy) => {
            const status = statusConfig[deploy.status] || statusConfig.pending;
            const model = models.find((m) => m.id === deploy.modelId);
            return (
              <Card key={deploy.id} className="p-6 liquid-glass hover:liquid-glass-interactive transition-all flex flex-col justify-between h-fit">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                        <Cpu className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">
                          {targetLabels[deploy.target] || deploy.target}
                        </h3>
                        <p className="text-xs text-slate-400">
                          Model: {model?.name || deploy.modelId.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                      <span className="text-slate-400 block mb-0.5 font-semibold uppercase tracking-wider text-[9px]">Target environment</span>
                      <span className="font-bold text-white">{targetLabels[deploy.target]}</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                      <span className="text-slate-400 block mb-0.5 font-semibold uppercase tracking-wider text-[9px]">Created at</span>
                      <span className="font-bold text-white">
                        {new Date(deploy.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Estimations Block */}
                  {model && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs space-y-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-semibold">Est. Flash Usage</span>
                        <span className="font-mono text-white font-semibold">
                           {((model.size / 1024) * 1.5).toFixed(1)} KB
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-semibold">Est. RAM (Arena)</span>
                        <span className="font-mono text-white font-semibold">
                           {((model.size / 1024) * 0.8 + 2).toFixed(1)} KB
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-semibold">Est. Latency</span>
                        <span className="font-mono text-white font-semibold">
                           {deploy.target === 'esp32-s3' ? '2-4 ms' : deploy.target === 'raspberry-pi-pico' ? '5-8 ms' : '10-20 ms'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center border-t border-white/10 pt-4 mt-6">
                  {deploy.status === 'ready' ? (
                    <>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => handleViewFiles(deploy)}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1 text-blue-400" /> View Files
                      </Button>
                      
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => handleDownloadFirmware(deploy)}
                      >
                        <Download className="w-3.5 h-3.5 mr-1" /> Download firmware
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                      <Terminal className="w-4 h-4 animate-spin text-blue-400" />
                      <span>Compiler pipeline active. Polling compile run...</span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Compile Hardware Firmware"
        description="Pack your INT8 model flatbuffer into a ready-to-flash PlatformIO C++ workspace."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-300 font-semibold mb-1.5">Select trained model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-[#0e1424] border border-white/20 rounded-xl p-2.5 text-sm text-white focus:outline-none w-full"
            >
              <option value="">Choose a model...</option>
              {projectModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({(m.accuracy * 100).toFixed(1)}% acc · {(m.size / 1024).toFixed(1)} KB)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-300 font-semibold mb-1.5">Target microcontroller hardware</label>
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value as DeploymentTarget)}
              className="bg-[#0e1424] border border-white/20 rounded-xl p-2.5 text-sm text-white focus:outline-none w-full"
            >
              {Object.entries(targetLabels).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary"
              onClick={handleCreate} 
              disabled={!selectedModel}
            >
              Build Firmware
            </Button>
          </div>
        </div>
      </Modal>

      {/* Files Viewer Modal */}
      <Modal
        open={showFilesModal}
        onClose={() => setShowFilesModal(false)}
        title="Generated Firmware Codebase"
        description="Inspect compile-ready C++ headers and PlatformIO templates."
      >
        {isFetchingFiles ? (
          <div className="h-40 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
            <Terminal className="w-5 h-5 animate-spin text-blue-400" />
            Loading workspace files...
          </div>
        ) : viewingFiles ? (
          <div className="space-y-4">
            {/* Tabs row */}
            <div className="flex border-b border-white/10">
              {Object.keys(viewingFiles).map((filename) => (
                <button
                  key={filename}
                  onClick={() => setActiveFileTab(filename)}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                    activeFileTab === filename
                      ? 'border-blue-400 text-blue-300'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {filename}
                </button>
              ))}
            </div>

            {/* Code preview area */}
            <div className="relative">
              <pre className="h-80 bg-[#070b13] border border-white/10 rounded-xl p-4 font-mono text-[11px] text-slate-300 overflow-y-auto leading-relaxed shadow-inner">
                <code>{viewingFiles[activeFileTab]}</code>
              </pre>
              
              <button 
                onClick={handleCopyCode}
                className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20 p-2 rounded-lg transition-colors shadow"
                title="Copy code to clipboard"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/10">
              <Button variant="secondary" onClick={() => setShowFilesModal(false)}>Close</Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export default function DeploymentsPage() {
  return (
    <Suspense fallback={
      <div className="h-40 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
        <Cpu className="w-5 h-5 animate-spin text-blue-500" />
        Loading deployments...
      </div>
    }>
      <DeploymentsContent />
    </Suspense>
  );
}
