'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Activity, 
  Upload, 
  Wifi, 
  WifiOff, 
  Radio, 
  Play, 
  Square, 
  Trash2, 
  AlertTriangle,
  Info,
  Database,
  Tag
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSerialStore } from '@/stores/serial-store';
import { useProjectStore } from '@/stores/project-store';
import { useSettingsStore } from '@/stores/settings-store';
import { LiveChart } from '@/components/ui/live-chart';
import { api } from '@/services/api';
import { toast } from '@/stores/toast-store';
import { getChannelNames } from '@/lib/utils';

function RecordingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetDatasetId = searchParams.get('datasetId');

  const { 
    connectionStatus, 
    connect, 
    connectMock, 
    disconnect, 
    dataBuffer, 
    setDataBuffer,
    droppedFramesCount,
    isRecording,
    setIsRecording,
    clearBuffer
  } = useSerialStore();

  const { activeProject, datasets } = useProjectStore();
  const { baudRate } = useSettingsStore();

  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [selectedLabelName, setSelectedLabelName] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [serialSupported, setSerialSupported] = useState(true);

  // Check Web Serial support
  useEffect(() => {
    setSerialSupported(typeof window !== 'undefined' && 'serial' in navigator);
  }, []);

  // Filter datasets mapped to the active project
  const projectDatasets = activeProject
    ? datasets.filter((d) => d.projectId === activeProject.id || (d as any).project_id === activeProject.id)
    : [];

  // Handle preset dataset selection query parameter
  useEffect(() => {
    if (presetDatasetId) {
      setSelectedDatasetId(presetDatasetId);
    } else if (projectDatasets.length > 0 && !selectedDatasetId) {
      setSelectedDatasetId(projectDatasets[0].id);
    }
  }, [presetDatasetId, projectDatasets, selectedDatasetId]);

  const selectedDataset = datasets.find(d => d.id === selectedDatasetId);

  // Reset label selection when active dataset changes
  useEffect(() => {
    if (selectedDataset && selectedDataset.labels.length > 0) {
      setSelectedLabelName(selectedDataset.labels[0].name);
    } else {
      setSelectedLabelName('');
    }
  }, [selectedDatasetId]);

  const handleUpload = async () => {
    if (!activeProject || !selectedDataset) {
      toast.error('Active project and target dataset are required.');
      return;
    }
    if (dataBuffer.length === 0) {
      toast.error('No telemetry data recorded in buffer. Record some data first.');
      return;
    }
    if (!selectedLabelName) {
      toast.error('Please configure and select a target label tag before uploading.');
      return;
    }

    const channelCount = activeProject.channelCount || 3;
    const samples = [];
    for (let i = 0; i < dataBuffer.length; i += channelCount) {
      samples.push(Array.from(dataBuffer.slice(i, i + channelCount)));
    }

    try {
      setIsUploading(true);
      await api.addSample(selectedDataset.id, {
        payload: samples,
        label_id: selectedLabelName,
        metadata: { 
          source: connectionStatus === 'connected' && !useSerialStore.getState().mockInterval ? 'web-serial' : 'simulator',
          sampleRate: activeProject.sampleRate || 50,
          channels: getChannelNames(activeProject)
        },
      });
      
      toast.success(`Successfully uploaded ${samples.length} telemetry samples to dataset "${selectedDataset.name}"!`);
      clearBuffer();
    } catch (e: any) {
      toast.error(`Upload failed: ${e.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const startConnect = async () => {
    const chCount = activeProject?.channelCount || 3;
    try {
      await connect(baudRate, chCount);
    } catch (err: any) {
      toast.error(`Connection failed: ${err.message}`);
    }
  };

  const startConnectMock = () => {
    const chCount = activeProject?.channelCount || 3;
    connectMock(chCount);
  };

  const handleStartRecording = () => {
    if (connectionStatus !== 'connected') {
      toast.error('Connect a device or simulator first to record.');
      return;
    }
    clearBuffer();
    setIsRecording(true);
    toast.info('Recording started. Stream data is buffering...');
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    toast.info('Recording stopped.');
  };

  const sampleRate = activeProject?.sampleRate || 50;
  const channelCount = activeProject?.channelCount || 3;
  const bufferDuration = (dataBuffer.length / channelCount) / sampleRate;

  const statusConfig = {
    disconnected: { color: 'text-slate-500', bg: 'bg-slate-500', label: 'Disconnected', icon: WifiOff },
    connecting: { color: 'text-amber-400', bg: 'bg-amber-400', label: 'Connecting...', icon: Radio },
    connected: { color: 'text-emerald-400', bg: 'bg-emerald-400', label: 'Connected', icon: Wifi },
    error: { color: 'text-rose-500', bg: 'bg-rose-500', label: 'Error', icon: WifiOff },
  };

  const currentStatus = statusConfig[connectionStatus];
  const StatusIcon = currentStatus.icon;

  if (!activeProject) {
    return (
      <Card className="p-8 text-center border-slate-200 bg-white shadow-sm space-y-4">
        <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">No Active Project Selected</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Please select or create an active project workspace to begin telemetry recording.
        </p>
        <Button onClick={() => router.push('/projects')}>Go to Projects</Button>
      </Card>
    );
  }

  if (projectDatasets.length === 0) {
    return (
      <Card className="p-8 text-center border-slate-200 bg-white shadow-sm space-y-4">
        <Database className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">No Target Datasets Available</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          You need to define at least one dataset repository in your project to save recordings.
        </p>
        <Button onClick={() => router.push('/datasets')}>Create a Dataset</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Data Recording</h1>
          <p className="text-slate-400 mt-1">Record real-time multi-channel sensor signals into your dataset.</p>
        </div>
        <div className="flex gap-3">
          {dataBuffer.length > 0 && (
            <Button 
              variant="primary"
              onClick={handleUpload} 
              disabled={isUploading || isRecording}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : `Upload ${Math.floor(dataBuffer.length / channelCount)} Samples`}
            </Button>
          )}
          {connectionStatus === 'connected' ? (
            <Button variant="danger" onClick={disconnect}>
              Disconnect Device
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={startConnectMock} disabled={connectionStatus === 'connecting'}>
                Simulator Mode (Virtual)
              </Button>
              <Button 
                variant="primary"
                onClick={startConnect} 
                disabled={connectionStatus === 'connecting' || !serialSupported}
                title={!serialSupported ? 'Web Serial not supported in this browser' : ''}
              >
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect Device'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {!serialSupported && (
        <div className="bg-amber-500/15 border border-amber-500/30 text-amber-200 p-4 rounded-2xl text-xs leading-normal flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong>Web Serial API Unavailable</strong>: Your browser does not support Web Serial connections. 
            You can still use <strong>Simulator Mode</strong> to stream synthetic data, or switch to Chrome/Edge.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart View */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-96 flex items-center justify-center bg-white/5 p-4 border border-white/10 relative overflow-hidden liquid-glass">
            {connectionStatus === 'connected' ? (
              <LiveChart data={dataBuffer} channels={channelCount} />
            ) : (
              <div className="text-center text-slate-400">
                <Activity className="w-16 h-16 mx-auto mb-4 opacity-30 text-blue-400 animate-pulse" />
                <p className="text-lg font-bold mb-1 text-white">Telemetry Stream Inactive</p>
                <p className="text-sm text-slate-400">
                  Connect a device or run simulator mode to view live data.
                </p>
              </div>
            )}
            
            {/* Live Recording Overlay Indicator */}
            {isRecording && (
              <div className="absolute top-4 left-4 bg-rose-500 text-white text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow animate-pulse z-20">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                Recording Active
              </div>
            )}
          </Card>

          {/* Recording Controls Panel */}
          <Card className="p-5 flex items-center justify-between border-white/10 liquid-glass">
            <div className="flex gap-2">
              {!isRecording ? (
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow"
                  onClick={handleStartRecording}
                  disabled={connectionStatus !== 'connected'}
                >
                  <Play className="w-4 h-4 fill-current" /> Start Recording
                </Button>
              ) : (
                <Button 
                  variant="danger" 
                  className="flex items-center gap-1.5 shadow"
                  onClick={handleStopRecording}
                >
                  <Square className="w-4 h-4 fill-current" /> Stop Recording
                </Button>
              )}
              
              <Button 
                variant="secondary" 
                className="flex items-center gap-1"
                onClick={clearBuffer}
                disabled={dataBuffer.length === 0 || isRecording}
              >
                <Trash2 className="w-4 h-4 text-rose-400" /> Clear Buffer
              </Button>
            </div>

            <div className="text-xs text-slate-400 font-semibold">
              Recording Buffer Size: <span className="text-white font-mono">{Math.floor(dataBuffer.length / channelCount)} frames</span>
            </div>
          </Card>
        </div>
        
        {/* Settings & Config Column */}
        <div className="space-y-6">
          {/* Target Dataset Selection */}
          <Card className="p-5 space-y-4 liquid-glass">
            <h3 className="font-bold text-white border-b border-white/10 pb-2 text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" /> Target Dataset
            </h3>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-300 font-semibold">Select dataset to save to</label>
              <select 
                value={selectedDatasetId}
                onChange={(e) => setSelectedDatasetId(e.target.value)}
                disabled={isRecording || isUploading}
                className="bg-[#0e1424] border border-white/20 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              >
                {projectDatasets.map((ds) => (
                  <option key={ds.id} value={ds.id}>{ds.name} ({ds.sampleCount} samples)</option>
                ))}
              </select>
            </div>
          </Card>

          {/* Recording Label selection */}
          {selectedDataset && (
            <Card className="p-5 space-y-4 liquid-glass">
              <h3 className="font-bold text-white border-b border-white/10 pb-2 text-sm flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-400" /> Active Label Tag
              </h3>
              <p className="text-xs text-slate-300 leading-normal">Configure the category label tag for the telemetries being recorded:</p>
              
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedDataset.labels.map((label) => (
                  <button
                    key={label.name}
                    disabled={isRecording || isUploading}
                    onClick={() => setSelectedLabelName(label.name)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all ${
                      selectedLabelName === label.name
                        ? 'bg-blue-500/20 border-blue-400 text-blue-300 shadow-sm ring-1 ring-blue-400'
                        : 'bg-white/5 hover:bg-white/10 border-white/15 text-slate-300'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: label.color }} />
                    {label.name}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Connection Statistics */}
          <Card className="p-5 space-y-4 liquid-glass">
            <h3 className="font-bold text-white border-b border-white/10 pb-2 text-sm">Telemetry Diagnostics</h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Connection status</span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${currentStatus.bg} ${connectionStatus === 'connecting' ? 'animate-pulse' : ''}`} />
                  <span className={`${currentStatus.color} font-semibold`}>{currentStatus.label}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Target frequency</span>
                <span className="text-white font-mono">{sampleRate} Hz</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Dynamic channels</span>
                <span className="text-white font-mono">{channelCount} columns</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-2">
                <span className="text-slate-400">Buffer duration</span>
                <span className="text-white font-mono">{bufferDuration.toFixed(1)}s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Dropped/Corrupt frames</span>
                <span className={`font-mono ${droppedFramesCount > 0 ? 'text-amber-400' : 'text-white'}`}>
                  {droppedFramesCount} frames
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function RecordingPage() {
  return (
    <Suspense fallback={
      <div className="h-40 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
        <Activity className="w-5 h-5 animate-spin text-blue-500" />
        Loading recording panel...
      </div>
    }>
      <RecordingPageContent />
    </Suspense>
  );
}
