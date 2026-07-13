'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { 
  Play,
  Square,
  Activity,
  Cpu,
  Wifi,
  WifiOff,
  Save,
  Radio,
  Info
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useProjectStore } from '@/stores/project-store';
import { useSerialStore } from '@/stores/serial-store';
import { toast } from '@/stores/toast-store';
import { api } from '@/services/api';

function LiveClassificationContent() {
  const { activeProject, models, datasets } = useProjectStore();
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isSimulator, setIsSimulator] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);
  
  const [waveform, setWaveform] = useState<number[][]>([]);
  const [currentPred, setCurrentPred] = useState<{label: string, conf: number} | null>(null);
  const [history, setHistory] = useState<{ts: number, label: string, conf: number, lat: number}[]>([]);
  const [metrics, setMetrics] = useState({ latency: 0, fps: 0, dropped: 0 });
  const [isSaving, setIsSaving] = useState(false);
  
  const streamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inferIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveDataRef = useRef<number[][]>([]);
  const droppedRef = useRef(0);
  const lastErrorToastRef = useRef(0);
  
  const filteredModels = activeProject
    ? models.filter((m) => m.projectId === activeProject.id)
    : [];
    
  const activeDataset = activeProject
    ? datasets.find(d => d.projectId === activeProject.id)
    : null;

  const handleConnectSimulator = () => {
    setIsConnected(true);
    setIsSimulator(true);
    toast.success('Connected to sensor simulator (Demo Mode)');
  };

  const handleConnectWebSerial = async () => {
    if (!('serial' in navigator)) {
      toast.error('Web Serial API is not supported in this browser. Use Chrome or Edge.');
      return;
    }
    try {
      await useSerialStore.getState().connect(115200, activeProject?.channelCount || 3);
      setIsConnected(true);
      setIsSimulator(false);
      toast.success('Connected to serial device (Real Hardware Mode)');
    } catch (err: any) {
      toast.error(`Serial connect failed: ${err.message}`);
    }
  };

  const handleDisconnect = async () => {
    stopStreaming();
    if (!isSimulator) {
      await useSerialStore.getState().disconnect();
    }
    setIsConnected(false);
    setIsSimulator(false);
    toast.info('Device disconnected');
  };

  const startStreaming = () => {
    setIsStreaming(true);
    droppedRef.current = 0;
    const channels = activeProject?.channelCount || 3;
    waveDataRef.current = Array.from({ length: 100 }, () => Array(channels).fill(0));
    setWaveform(waveDataRef.current);
    
    streamIntervalRef.current = setInterval(() => {
      if (isSimulator) {
        const t = Date.now() / 1000;
        const newPoint = Array.from({ length: channels }, (_, chIdx) => {
          const freq = 2 + chIdx * 1.5;
          return Math.sin(t * freq) * (1.0 - chIdx * 0.2) + (Math.random() * 0.2 - 0.1);
        });
        waveDataRef.current = [...waveDataRef.current.slice(1), newPoint];
        setWaveform([...waveDataRef.current]);
      } else {
        // Read from real serial dataBuffer
        const buffer = useSerialStore.getState().dataBuffer;
        if (buffer && buffer.length >= channels) {
          const latestPoint = Array.from(buffer.slice(-channels));
          waveDataRef.current = [...waveDataRef.current.slice(1), latestPoint];
          setWaveform([...waveDataRef.current]);
        }
      }
    }, 33);
    
    inferIntervalRef.current = setInterval(async () => {
      const t0 = performance.now();
      try {
        let pred: any;
        if (selectedModelId) {
          try {
            pred = await api.inferModel(selectedModelId, { window: waveDataRef.current });
          } catch {
            if (isSimulator) {
              const rand = Math.random();
              const label = rand > 0.55 ? 'active' : 'idle';
              const conf = 0.6 + Math.random() * 0.39;
              pred = { label, confidence: conf, probabilities: { [label]: conf } };
            } else {
              throw new Error("Backend inference request failed");
            }
          }
        } else if (isSimulator) {
          const rand = Math.random();
          const label = rand > 0.55 ? 'active' : 'idle';
          const conf = 0.6 + Math.random() * 0.39;
          pred = { label, confidence: conf, probabilities: { [label]: conf } };
        } else {
          return;
        }
        
        const latency = performance.now() - t0;
        const label = pred.label || 'unknown';
        const conf = pred.confidence || 0;
        
        if (conf >= confidenceThreshold || label === 'unknown') {
          setCurrentPred({ label, conf });
          setHistory(prev => [{ ts: Date.now(), label, conf, lat: latency }, ...prev].slice(0, 15));
        }
        
        setMetrics(_prev => ({
          latency: parseFloat(latency.toFixed(1)),
          fps: 30,
          dropped: droppedRef.current
        }));
      } catch (err: any) {
        droppedRef.current++;
        if (Date.now() - lastErrorToastRef.current > 5000) {
          lastErrorToastRef.current = Date.now();
          toast.error(`Inference error: ${err.message || 'Backend request failed'}`);
        }
      }
    }, 500);
  };

  const stopStreaming = () => {
    setIsStreaming(false);
    if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    if (inferIntervalRef.current) clearInterval(inferIntervalRef.current);
  };

  const handleSaveCapture = async () => {
    if (!activeDataset) {
      toast.error('No active dataset. Create one first.');
      return;
    }
    if (waveDataRef.current.length === 0) {
      toast.error('No data captured yet.');
      return;
    }
    setIsSaving(true);
    try {
      const captureLabel = currentPred?.label || 'unlabeled';
      await api.saveSampleFromCapture(
        activeDataset.id,
        captureLabel,
        waveDataRef.current,
        { source: 'live-capture', timestamp: Date.now() }
      );
      toast.success(`Captured window saved as '${captureLabel}' to dataset`);
    } catch (err: any) {
      toast.error(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
      if (inferIntervalRef.current) clearInterval(inferIntervalRef.current);
    };
  }, []);

  const renderWaveform = () => {
    if (waveform.length === 0) return null;
    const width = 1000;
    const height = 150;
    const padding = 10;
    const channels = activeProject?.channelCount || 3;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    const paths = Array.from({ length: channels }, (_, chIdx) => {
      const points = waveform.map((row, stepIdx) => {
        const x = padding + (stepIdx / (waveform.length - 1)) * (width - padding * 2);
        const y = height / 2 - ((row[chIdx] || 0) / 2) * (height / 2 - padding);
        return `${x},${y}`;
      });
      return `M ${points.join(' L ')}`;
    });
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40 bg-slate-950 rounded-xl border border-slate-800">
        {paths.map((p, idx) => (
          <path key={idx} d={p} fill="none" stroke={colors[idx % colors.length]} strokeWidth="2" strokeLinejoin="round" />
        ))}
      </svg>
    );
  };

  if (!activeProject) {
    return (
      <Card className="p-8 text-center border-slate-200 bg-white shadow-sm space-y-4">
        <Radio className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">No Active Project Workspace</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">Choose a workspace to stream live device classification.</p>
      </Card>
    );
  }

  if (filteredModels.length === 0) {
    return (
      <EmptyState icon={Radio} title="No Models Available" description="Train a model first to run live classifications." />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-serif">Live Classification</h1>
          <p className="text-slate-500 mt-1">Stream live sensor data through your deployed model.</p>
        </div>
        <div className="flex gap-3 items-center">
          {isConnected && (
            <Badge variant={isSimulator ? 'warning' : 'success'}>
              {isSimulator ? 'Simulator Mode' : 'Live Mode'}
            </Badge>
          )}
          {isConnected ? (
            <Button variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50" onClick={handleDisconnect}>
              <WifiOff className="w-4 h-4 mr-2" /> Disconnect
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleConnectSimulator}>
                <Cpu className="w-4 h-4 mr-2" /> Use Simulator
              </Button>
              <Button className="bg-slate-900 text-white hover:bg-slate-800" onClick={handleConnectWebSerial}>
                <Wifi className="w-4 h-4 mr-2" /> Connect WebSerial
              </Button>
            </>
          )}
        </div>
      </div>

      {isSimulator && (
        <div className="flex items-center gap-2 text-xs bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-700">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span><strong>Demo Mode:</strong> Using synthetic sensor data and local fallback predictions. Connect a real WebSerial device and select a trained model for live inference.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-5 border-slate-200 bg-white shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Configuration</h3>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Model</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                disabled={isStreaming}
              >
                <option value="">-- Choose deployed model --</option>
                {filteredModels.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confidence Threshold</label>
                <span className="text-xs font-mono text-slate-600">{confidenceThreshold.toFixed(2)}</span>
              </div>
              <input type="range" min="0.1" max="0.95" step="0.05"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
            
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              {!isStreaming ? (
                <Button 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                  onClick={startStreaming}
                  disabled={!isConnected}
                >
                  <Play className="w-4 h-4 mr-2" /> Start Stream
                </Button>
              ) : (
                <Button 
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white"
                  onClick={stopStreaming}
                >
                  <Square className="w-4 h-4 mr-2" /> Stop Stream
                </Button>
              )}
            </div>
          </Card>

          <Card className="p-5 border-slate-200 bg-white shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center">
              <Activity className="w-4 h-4 mr-2 text-blue-500" />
              Telemetry
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <span className="text-xs text-slate-500">Inference Latency</span>
                <span className="text-sm font-mono font-semibold text-slate-700">{metrics.latency} ms</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <span className="text-xs text-slate-500">Data Rate</span>
                <span className="text-sm font-mono font-semibold text-slate-700">{metrics.fps} Hz</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Dropped Frames</span>
                <span className={`text-sm font-mono font-semibold ${metrics.dropped > 0 ? 'text-rose-500' : 'text-slate-700'}`}>
                  {metrics.dropped}
                </span>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <Card className="p-5 border-slate-200 bg-white shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">Live Sensor Buffer</h3>
              <Badge variant={isStreaming ? 'success' : 'default'}>{isStreaming ? 'Streaming...' : 'Idle'}</Badge>
            </div>
            {isStreaming ? renderWaveform() : (
              <div className="w-full h-40 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 text-sm">
                Connect and start stream to view signal
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" className="text-xs h-8" onClick={handleSaveCapture} disabled={!isStreaming || isSaving}>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {isSaving ? 'Saving...' : 'Save to Dataset'}
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5 border-slate-200 bg-white shadow-sm flex flex-col justify-center">
              <h3 className="font-bold text-slate-800 text-sm mb-6 text-center">Current Prediction</h3>
              {currentPred ? (
                <div className="text-center space-y-4">
                  <div className="text-5xl font-bold font-serif text-blue-600 capitalize">{currentPred.label}</div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl font-mono font-semibold text-slate-700">{(currentPred.conf * 100).toFixed(1)}%</span>
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Confidence</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${currentPred.conf > 0.8 ? 'bg-emerald-500' : currentPred.conf > 0.5 ? 'bg-amber-400' : 'bg-rose-500'}`}
                      style={{ width: `${currentPred.conf * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-400 py-8">No prediction data yet</div>
              )}
            </Card>

            <Card className="p-0 border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-[280px]">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-800 text-sm">Inference History</h3>
              </div>
              <div className="overflow-y-auto flex-1 p-2 space-y-1">
                {history.length > 0 ? history.map((h, i) => (
                  <div key={i} className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50 text-xs">
                    <div className="flex gap-3">
                      <span className="text-slate-400 font-mono">{new Date(h.ts).toISOString().split('T')[1].slice(0, 12)}</span>
                      <span className={`font-bold ${h.label === 'unknown' ? 'text-slate-500' : 'text-slate-800'}`}>{h.label}</span>
                    </div>
                    <div className="flex gap-4 font-mono text-slate-600">
                      <span>{(h.conf * 100).toFixed(1)}%</span>
                      <span className="text-slate-400 w-12 text-right">{h.lat.toFixed(1)}ms</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-slate-400 py-8 text-sm">Waiting for inferences...</div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LiveClassificationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 animate-pulse">Loading Live Classification...</div>}>
      <LiveClassificationContent />
    </Suspense>
  );
}
