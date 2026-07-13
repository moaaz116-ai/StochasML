'use client';

import { useState, useEffect, Suspense } from 'react';
import { 
  Settings2, 
  Database, 
  Cpu, 
  BrainCircuit, 
  Sliders, 
  LineChart as ChartIcon, 
  Save, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Table
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useProjectStore } from '@/stores/project-store';
import { toast } from '@/stores/toast-store';
import { api } from '@/services/api';

function ImpulsePageContent() {
  const { activeProject, updateProject } = useProjectStore();
  const [isSaving, setIsSaving] = useState(false);

  // Impulse block parameters
  const [windowSizeMs, setWindowSizeMs] = useState(1000);
  const [windowStrideMs, setWindowStrideMs] = useState(200);
  const [sampleRateHz, setSampleRateHz] = useState(50);
  const [zeroPadding, setZeroPadding] = useState(false);

  // Processing block parameters
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['rms', 'zcr', 'peaks']);
  const [normalization, setNormalization] = useState<'none' | 'zscore' | 'minmax'>('zscore');

  // Learning block parameters
  const [learningBlock, setLearningBlock] = useState<'dense' | 'cnn_1d'>('dense');

  // Load configuration from active project
  useEffect(() => {
    if (activeProject && activeProject.impulseConfig) {
      const config = typeof activeProject.impulseConfig === 'string' 
        ? JSON.parse(activeProject.impulseConfig) 
        : activeProject.impulseConfig;
      
      if (config.windowSizeMs) setWindowSizeMs(config.windowSizeMs);
      if (config.windowStrideMs) setWindowStrideMs(config.windowStrideMs);
      if (config.sampleRateHz) setSampleRateHz(config.sampleRateHz);
      if (config.zeroPadding !== undefined) setZeroPadding(config.zeroPadding);
      if (config.selectedFeatures) setSelectedFeatures(config.selectedFeatures);
      if (config.normalization) setNormalization(config.normalization);
      if (config.learningBlock) setLearningBlock(config.learningBlock);
    }
  }, [activeProject?.id]);

  const handleSave = async () => {
    if (!activeProject) {
      toast.error('No active project selected.');
      return;
    }
    
    setIsSaving(true);
    const impulseConfig = {
      windowSizeMs,
      windowStrideMs,
      sampleRateHz,
      zeroPadding,
      selectedFeatures,
      normalization,
      learningBlock
    };

    try {
      const updated = await api.updateProject(activeProject.id, {
        impulseConfig: JSON.stringify(impulseConfig)
      });
      if (updated) {
        // Trigger local store update
        updateProject(activeProject.id, {
          impulseConfig: JSON.stringify(impulseConfig)
        });
        toast.success('Impulse configuration saved successfully!');
      }
    } catch (e: any) {
      toast.error(`Failed to save impulse configuration: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFeature = (feat: string) => {
    if (selectedFeatures.includes(feat)) {
      setSelectedFeatures(selectedFeatures.filter(f => f !== feat));
    } else {
      setSelectedFeatures([...selectedFeatures, feat]);
    }
  };

  // Generate synthetic signal coordinates for waveform preview
  const generatePreviewSignal = () => {
    const points = [];
    const length = 150;
    for (let i = 0; i < length; i++) {
      const t = i / 30;
      // Synthesize sine wave combined with high frequency noise
      const val = Math.sin(t * 2.5) * 40 + Math.cos(t * 12.0) * 12 + 75;
      points.push(`${(i * 3.5).toFixed(1)},${val.toFixed(1)}`);
    }
    return points.join(' ');
  };

  // Generate feature preview calculations
  const sampleFeatures = [
    { name: 'Root Mean Square (RMS)', value: '38.42', description: 'Represents the average power level of the raw signal.' },
    { name: 'Zero Crossing Rate (ZCR)', value: '14.00', description: 'Frequency of sign transitions per window frame.' },
    { name: 'Spectral Peak Frequency', value: '2.54 Hz', description: 'Dominant signal oscillation speed.' },
    { name: 'Skewness', value: '0.12', description: 'Symmetry level of data distribution.' },
    { name: 'Kurtosis', value: '2.84', description: 'Peakness compared to normal distribution.' }
  ];

  if (!activeProject) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center h-[calc(100vh-10rem)]">
        <Card className="p-8 max-w-md w-full text-center border-dashed border-2 border-slate-200 bg-white/50 backdrop-blur-xl shadow-sm">
          <Database className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">No Active Project</h2>
          <p className="text-slate-500 text-sm mb-6">Select or create a project first before designing your machine learning Impulse.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings2 className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-serif">Impulse Design</h1>
          </div>
          <p className="text-sm text-slate-500">Configure your signal window partitioning, pre-processing features, and classifier topologies.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-blue-600 text-white hover:bg-blue-500 shadow-md flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Impulse'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Blocks Settings */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Input Block */}
          <Card className="p-6 border border-slate-200 bg-white shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sliders className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-bold text-slate-900">1. Time-Series Input partition</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Window Size (ms)"
                type="number"
                value={windowSizeMs}
                onChange={(e) => setWindowSizeMs(Number(e.target.value))}
                helperText="The duration of each slide partition window (e.g. 1000ms)."
              />
              <Input
                label="Window Stride / Increase (ms)"
                type="number"
                value={windowStrideMs}
                onChange={(e) => setWindowStrideMs(Number(e.target.value))}
                helperText="Slicing stride step. Smaller stride creates overlapping windows."
              />
              <Input
                label="Frequency (Hz)"
                type="number"
                value={sampleRateHz}
                onChange={(e) => setSampleRateHz(Number(e.target.value))}
                helperText="Expected sensor sample frequency matching target hardware (e.g. 50Hz)."
              />
              <div className="flex flex-col justify-center">
                <label className="text-xs text-slate-500 font-semibold mb-2">Zero-Padding Mode</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    id="zero-pad"
                    checked={zeroPadding}
                    onChange={(e) => setZeroPadding(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="zero-pad" className="text-sm text-slate-700">Pad short recordings with zeros</label>
                </div>
              </div>
            </div>
          </Card>

          {/* 2. Processing Block */}
          <Card className="p-6 border border-slate-200 bg-white shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Cpu className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg font-bold text-slate-900">2. Processing Feature Extractor Block</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 font-semibold">Pre-Processing Normalization</label>
                <select
                  value={normalization}
                  onChange={(e) => setNormalization(e.target.value as any)}
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="none">None (Raw Signal)</option>
                  <option value="zscore">Z-score Standardization (Mean=0, Std=1)</option>
                  <option value="minmax">Min-Max Rescaling (0 to 1)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 font-semibold mb-2 block">Extractable Time-Domain Features</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { id: 'rms', name: 'Root Mean Square (RMS)' },
                    { id: 'zcr', name: 'Zero Crossing Rate (ZCR)' },
                    { id: 'peaks', name: 'Spectral Peaks' },
                    { id: 'skew', name: 'Skewness' },
                    { id: 'kurt', name: 'Kurtosis' }
                  ].map((feat) => {
                    const isSel = selectedFeatures.includes(feat.id);
                    return (
                      <button
                        key={feat.id}
                        onClick={() => toggleFeature(feat.id)}
                        className={`p-3 text-left border rounded-lg text-xs font-medium transition-all ${
                          isSel 
                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' 
                            : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                        }`}
                      >
                        {feat.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          {/* 3. Learning Block */}
          <Card className="p-6 border border-slate-200 bg-white shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <BrainCircuit className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-slate-900">3. Learning Classifier Block</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={() => setLearningBlock('dense')}
                className={`p-4 border rounded-xl cursor-pointer transition-all ${
                  learningBlock === 'dense'
                    ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <h3 className="font-bold text-slate-900 text-sm mb-1">Dense Classifier (MLP)</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Best for low dimensionality or pre-processed statistical feature tables. Extremely low memory requirements.
                </p>
              </div>

              <div
                onClick={() => setLearningBlock('cnn_1d')}
                className={`p-4 border rounded-xl cursor-pointer transition-all ${
                  learningBlock === 'cnn_1d'
                    ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <h3 className="font-bold text-slate-900 text-sm mb-1">1D Convolutional Neural Network (CNN)</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Best for raw waveform arrays. Convolution kernels automatically capture spatial templates and dependencies.
                </p>
              </div>
            </div>
          </Card>

        </div>

        {/* Right Column - Impulse Previews & Projections */}
        <div className="space-y-6">
          
          {/* Signal Slicing Preview */}
          <Card className="p-6 border border-slate-200 bg-white shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <ChartIcon className="w-4 h-4 text-blue-500" />
              <h3 className="font-bold text-slate-900 text-sm">Impulse Waveform Preview</h3>
            </div>

            <p className="text-xs text-slate-500">Visualizing raw waveform data segmented by window boundaries (length: {windowSizeMs}ms).</p>
            
            {/* SVG Waveform diagram */}
            <div className="relative h-32 w-full bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 520 150">
                {/* Horizontal reference grid lines */}
                <line x1="0" y1="75" x2="520" y2="75" stroke="#e2e8f0" strokeDasharray="3" />
                {/* Waveform line */}
                <polyline
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  points={generatePreviewSignal()}
                />
                
                {/* Sliding window selection box */}
                <rect
                  x="60"
                  y="5"
                  width="180"
                  height="140"
                  fill="rgba(59, 130, 246, 0.15)"
                  stroke="#2563eb"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
                {/* Window metadata flag */}
                <text x="65" y="20" className="text-[10px] font-bold fill-blue-700 font-sans">Active Window</text>
              </svg>
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span>0 ms</span>
              <span>Slice Stride: {windowStrideMs}ms</span>
              <span>Duration: ~5s</span>
            </div>
          </Card>

          {/* Generated Features Table */}
          <Card className="p-6 border border-slate-200 bg-white shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Table className="w-4 h-4 text-indigo-500" />
              <h3 className="font-bold text-slate-900 text-sm">Calculated Features preview</h3>
            </div>

            <div className="space-y-3">
              {sampleFeatures.map((feat) => {
                const isExtracted = selectedFeatures.includes('rms') && feat.name.includes('RMS') ||
                                    selectedFeatures.includes('zcr') && feat.name.includes('Zero') ||
                                    selectedFeatures.includes('peaks') && feat.name.includes('Peak') ||
                                    selectedFeatures.includes('skew') && feat.name.includes('Skewness') ||
                                    selectedFeatures.includes('kurt') && feat.name.includes('Kurtosis');

                return (
                  <div key={feat.name} className={`flex items-start justify-between gap-3 text-xs pb-2 border-b border-slate-50 last:border-0 ${isExtracted ? 'opacity-100' : 'opacity-40'}`}>
                    <div>
                      <span className="font-semibold text-slate-800">{feat.name}</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{feat.description}</p>
                    </div>
                    <span className={`font-mono font-bold ${isExtracted ? 'text-indigo-600' : 'text-slate-400'}`}>{feat.value}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Target constraints matrix preview */}
          <Card className="p-6 border border-slate-200 bg-slate-900 text-slate-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h4 className="font-bold text-sm">Hardware constraints Matrix</h4>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Based on the active board target (<strong>{activeProject.targetBoard}</strong>), here is the computed resource footprint projection:
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1 text-[11px] font-mono">
              <div className="p-2 bg-slate-800/80 rounded">
                <span className="text-[9px] text-slate-400 block uppercase">RAM Estimate</span>
                <span className="font-bold text-emerald-400">~12.4 KB</span>
              </div>
              <div className="p-2 bg-slate-800/80 rounded">
                <span className="text-[9px] text-slate-400 block uppercase">Flash footprint</span>
                <span className="font-bold text-emerald-400">~85 KB</span>
              </div>
              <div className="p-2 bg-slate-800/80 rounded col-span-2">
                <span className="text-[9px] text-slate-400 block uppercase">DSP pre-processing latency</span>
                <span className="font-bold text-blue-400">&lt; 1.5 ms on clock 240MHz</span>
              </div>
            </div>
          </Card>

        </div>

      </div>
    </div>
  );
}

export default function ImpulsePage() {
  return (
    <Suspense fallback={
      <div className="h-40 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
        <Sliders className="w-5 h-5 animate-spin text-blue-500" />
        Loading Impulse Studio...
      </div>
    }>
      <ImpulsePageContent />
    </Suspense>
  );
}
