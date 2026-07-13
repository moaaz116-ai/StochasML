'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Database, 
  Plus, 
  FileJson, 
  Upload, 
  Activity, 
  BrainCircuit, 
  Tag, 
  Trash2, 
  Eye,
  AlertCircle,
  CheckCircle2,
  X,
  Info
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { useProjectStore } from '@/stores/project-store';
import { type Dataset, type Label } from '@/lib/types';
import { toast } from '@/stores/toast-store';
import { api } from '@/services/api';
import { getChannelNames } from '@/lib/utils';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const PRESET_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function DatasetsPage() {
  const router = useRouter();
  const { datasets, activeProject, createDataset, fetchDatasets } = useProjectStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);

  // Create dataset form
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [initialLabels, setInitialLabels] = useState<{ name: string; color: string }[]>([
    { name: 'idle', color: PRESET_COLORS[0] },
    { name: 'active', color: PRESET_COLORS[1] }
  ]);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(PRESET_COLORS[2]);

  // Upload parser form
  const [fileText, setFileText] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsedData, setParsedData] = useState<number[][]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [targetUploadLabel, setTargetUploadLabel] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const filteredDatasets = activeProject
    ? datasets.filter((d) => d.projectId === activeProject.id || (d as any).project_id === activeProject.id)
    : [];

  const handleAddInitialLabel = () => {
    if (!newLabelName.trim()) return;
    if (initialLabels.some(l => l.name === newLabelName.trim())) {
      toast.error('Label name already exists.');
      return;
    }
    setInitialLabels([...initialLabels, { name: newLabelName.trim(), color: newLabelColor }]);
    setNewLabelName('');
  };

  const handleRemoveInitialLabel = (name: string) => {
    setInitialLabels(initialLabels.filter(l => l.name !== name));
  };

  const handleCreate = async () => {
    if (!newName.trim() || !activeProject) return;
    if (initialLabels.length < 2) {
      toast.error('At least two labels are required for classification models.');
      return;
    }

    try {
      const ds = await createDataset(
        newName.trim(), 
        newDesc.trim(), 
        activeProject.id, 
        initialLabels
      );
      if (ds) {
        toast.success(`Dataset "${ds.name}" created!`);
        setShowCreateModal(false);
        setNewName('');
        setNewDesc('');
        setInitialLabels([{ name: 'idle', color: PRESET_COLORS[0] }, { name: 'active', color: PRESET_COLORS[1] }]);
        await fetchDatasets(activeProject.id);
      }
    } catch (e: any) {
      toast.error(`Failed to create dataset: ${e.message}`);
    }
  };

  // Upload parser logic
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParseError(null);
    setParsedData([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setFileText(text);
      parseAndValidate(text, file.name);
    };
    reader.readAsText(file);
  };

  const parseAndValidate = (text: string, name: string) => {
    if (!activeProject) return;
    const channelCount = activeProject.channelCount || 3;

    try {
      if (name.endsWith('.json')) {
        const obj = JSON.parse(text);
        if (!Array.isArray(obj)) {
          throw new Error('JSON dataset must be a root array of rows.');
        }
        const data: number[][] = [];
        for (let idx = 0; idx < obj.length; idx++) {
          const row = obj[idx];
          if (!Array.isArray(row)) {
            throw new Error(`Row ${idx} is not an array.`);
          }
          if (row.length !== channelCount) {
            throw new Error(`Row ${idx} has ${row.length} values. Expected exactly ${channelCount} matching channels.`);
          }
          data.push(row.map(Number));
        }
        setParsedData(data);
      } else {
        // CSV parsing
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        const data: number[][] = [];
        let startIdx = 0;
        
        // Detect headers
        if (lines.length > 0 && isNaN(Number(lines[0].split(',')[0]))) {
          startIdx = 1;
        }

        for (let idx = startIdx; idx < lines.length; idx++) {
          const parts = lines[idx].split(',').map(Number);
          if (parts.some(isNaN)) {
            throw new Error(`Row ${idx} contains non-numeric values.`);
          }
          if (parts.length !== channelCount) {
            throw new Error(`Row ${idx} has ${parts.length} columns. Expected exactly ${channelCount} channels.`);
          }
          data.push(parts);
        }
        setParsedData(data);
      }
      toast.success('File parsed and validated successfully.');
    } catch (err: any) {
      setParseError(err.message || 'Unknown parsing error.');
      toast.error('File verification failed.');
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedDataset || parsedData.length === 0 || !targetUploadLabel) {
      toast.error('Select target label first.');
      return;
    }

    try {
      setIsUploading(true);
      await api.addSample(selectedDataset.id, {
        payload: parsedData,
        label_id: targetUploadLabel,
        metadata: { source: 'file-upload', filename: fileName },
      });
      toast.success('Dataset samples uploaded successfully!');
      setShowUploadModal(false);
      if (activeProject) await fetchDatasets(activeProject.id);
    } catch (e: any) {
      toast.error(`Upload failed: ${e.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Inline SVG visual chart builder for data preview
  const renderPreviewChart = () => {
    if (parsedData.length < 2) return null;
    
    // Take max 100 samples for preview
    const subset = parsedData.slice(0, 100);
    const width = 500;
    const height = 120;
    const padding = 10;

    // Find min and max for scaling
    const flat = subset.flat();
    const min = Math.min(...flat);
    const max = Math.max(...flat);
    const range = max - min || 1;

    const channels = activeProject?.channelCount || 3;
    const paths = Array.from({ length: channels }, (_, chIdx) => {
      const points = subset.map((row, stepIdx) => {
        const x = padding + (stepIdx / (subset.length - 1)) * (width - padding * 2);
        const y = height - padding - ((row[chIdx] - min) / range) * (height - padding * 2);
        return `${x},${y}`;
      });
      return `M ${points.join(' L ')}`;
    });

    const colors = PRESET_COLORS;

    return (
      <div className="space-y-2 mt-4">
        <label className="text-xs text-slate-500 font-semibold">Sensor Signal Telemetry Preview</label>
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28 overflow-visible">
            {paths.map((p, idx) => (
              <path
                key={idx}
                d={p}
                fill="none"
                stroke={colors[idx % colors.length]}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </svg>
          <div className="flex gap-4 mt-2 justify-center">
            {Array.from({ length: channels }, (_, idx) => (
              <div key={idx} className="flex items-center gap-1 text-[10px] text-slate-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                Channel {idx + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Label configuration modal functions
  const handleAddNewLabelToDataset = async () => {
    if (!selectedDataset || !newLabelName.trim()) return;
    const nextLabels = [...selectedDataset.labels, {
      id: Math.random().toString(36).substring(2, 9),
      name: newLabelName.trim(),
      color: newLabelColor,
      sampleCount: 0
    }];

    try {
      await api.updateDatasetLabels(selectedDataset.id, nextLabels);
      setSelectedDataset({
        ...selectedDataset,
        labels: nextLabels
      });
      toast.success('Label added to dataset.');
      setNewLabelName('');
      if (activeProject) await fetchDatasets(activeProject.id);
    } catch (e: any) {
      toast.error(`Failed to add label: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Datasets</h1>
          <p className="text-slate-400 mt-1">
            {activeProject
              ? `Showing datasets for ${activeProject.name}`
              : 'Select a project to manage datasets.'}
          </p>
        </div>
        <Button 
          variant="primary"
          onClick={() => setShowCreateModal(true)} 
          disabled={!activeProject}
          className="shadow-md"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Dataset
        </Button>
      </div>

      {!activeProject ? (
        <Card className="p-8 text-center border-white/10 liquid-glass shadow-sm space-y-4">
          <Database className="w-12 h-12 text-blue-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Active Project Workspace</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Choose a workspace under Projects first to configure labels, view sensor streams, or upload records.
          </p>
          <Button variant="primary" onClick={() => router.push('/projects')}>Go to Projects</Button>
        </Card>
      ) : filteredDatasets.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Database}
            title="No datasets found"
            description="Create a dataset to start collecting sensor data for training."
            action={<Button variant="primary" onClick={() => setShowCreateModal(true)}>Create Dataset</Button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDatasets.map((ds) => (
            <Card key={ds.id} className="p-6 liquid-glass hover:liquid-glass-interactive transition-all flex flex-col justify-between h-fit">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                      <FileJson className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{ds.name}</h3>
                      <p className="text-[10px] font-mono text-slate-400">{ds.id}</p>
                    </div>
                  </div>
                  <Badge variant="info">{ds.dataType}</Badge>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{ds.description}</p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                    <p className="text-base font-bold text-white">{ds.sampleCount}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Samples</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center flex flex-row items-center justify-center gap-1.5 cursor-pointer hover:bg-white/10"
                       onClick={() => { setSelectedDataset(ds); setShowLabelModal(true); }}>
                    <div>
                      <p className="text-base font-bold text-white">{ds.labels.length}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Labels</p>
                    </div>
                    <Tag className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                    <p className="text-base font-bold text-white">{formatBytes(ds.totalSize)}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Size</p>
                  </div>
                </div>

                {/* Labels Chips */}
                {ds.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {ds.labels.map((label) => (
                      <span
                        key={label.id}
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-white/10 border border-white/15 text-slate-200"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                        {label.name}
                        <span className="text-slate-400 font-medium">({label.sampleCount})</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center border-t border-white/10 pt-4 mt-6">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => {
                    setSelectedDataset(ds);
                    setFileName('');
                    setParsedData([]);
                    setParseError(null);
                    setTargetUploadLabel(ds.labels[0]?.name || '');
                    setShowUploadModal(true);
                  }}
                >
                  <Upload className="w-3.5 h-3.5 mr-1 text-blue-400" /> File Upload
                </Button>
                
                <div className="flex gap-2 flex-wrap justify-end">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => router.push(`/datasets/${ds.id}`)}
                  >
                    <Database className="w-3.5 h-3.5 mr-1 text-indigo-400" /> Explore Samples
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => router.push(`/recording?datasetId=${ds.id}`)}
                  >
                    <Activity className="w-3.5 h-3.5 mr-1 text-blue-400" /> Record Data
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => router.push(`/training?datasetId=${ds.id}`)}
                  >
                    <BrainCircuit className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Train Model
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dataset Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Dataset"
        description="Add a new structured sensor data repository."
      >
        <div className="space-y-4">
          <Input
            label="Dataset Name"
            placeholder="e.g. Accelerometer Gestures v1"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Input
            label="Description"
            placeholder="Brief details about gesture profiles..."
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />

          {/* Initial Labels Creator */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <h4 className="text-sm font-bold text-slate-800">Target Output Labels</h4>
            <p className="text-xs text-slate-500 leading-normal">Configure classification labels (at least 2 required, e.g. idle, wave).</p>
            
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  label="Label Name"
                  placeholder="e.g. swipe"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <label className="text-[11px] text-slate-500 font-semibold">Color</label>
                <div className="flex gap-1">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setNewLabelColor(c)}
                      className={`w-6 h-6 rounded-full border transition-all ${newLabelColor === c ? 'ring-2 ring-blue-500 scale-110' : 'border-slate-300'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <Button type="button" onClick={handleAddInitialLabel} className="bg-slate-800 text-white hover:bg-slate-700">
                Add Label
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2">
              {initialLabels.map((l) => (
                <span
                  key={l.name}
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-700"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                  {l.name}
                  <button 
                    onClick={() => handleRemoveInitialLabel(l.name)}
                    className="text-slate-400 hover:text-slate-600 ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary"
              onClick={handleCreate} 
              disabled={!newName.trim() || initialLabels.length < 2}
            >
              Create Dataset
            </Button>
          </div>
        </div>
      </Modal>

      {/* Upload Modal */}
      <Modal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload CSV / JSON Sensor Dataset"
        description="Verify and import raw sensor arrays directly into the database."
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-blue-500/15 border border-blue-500/30 text-blue-200 rounded-xl text-xs leading-normal">
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
            <div>
              Project expecting exactly <strong>{activeProject?.channelCount || 3} channels</strong>: 
              <code className="font-mono text-blue-300"> {getChannelNames(activeProject).join(', ')}</code>.
            </div>
          </div>

          {/* Drag and drop zone simulated */}
          <div className="border-2 border-dashed border-white/20 hover:border-blue-400 rounded-2xl p-6 text-center cursor-pointer transition-colors relative bg-white/5">
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <span className="text-sm font-semibold text-white block">
              {fileName ? fileName : 'Select dataset CSV or JSON file'}
            </span>
            <span className="text-xs text-slate-400 block mt-1">Files up to 100MB supported</span>
          </div>

          {parseError && (
            <div className="flex items-start gap-2.5 p-3 bg-rose-500/15 border border-rose-500/30 text-rose-200 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong>Verification Error</strong>: {parseError}
              </div>
            </div>
          )}

          {parsedData.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 rounded-xl text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Parsed {parsedData.length} records successfully.
              </div>

              {renderPreviewChart()}

              {/* Targets select */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-300 font-semibold">Target label tag</label>
                  <select 
                    value={targetUploadLabel}
                    onChange={(e) => setTargetUploadLabel(e.target.value)}
                    className="bg-[#0e1424] border border-white/20 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Choose label --</option>
                    {selectedDataset?.labels.map(l => (
                      <option key={l.id} value={l.name}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button variant="ghost" onClick={() => setShowUploadModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary"
              onClick={handleUploadSubmit}
              disabled={isUploading || parsedData.length === 0 || !targetUploadLabel}
            >
              {isUploading ? 'Uploading...' : 'Confirm Import'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Label Edit Modal */}
      <Modal
        open={showLabelModal}
        onClose={() => setShowLabelModal(false)}
        title="Manage Dataset Labels"
        description="Add output categories for neural classification."
      >
        <div className="space-y-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Input
                label="Label Name"
                placeholder="e.g. shake"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <label className="text-[11px] text-slate-300 font-semibold">Color</label>
              <div className="flex gap-1">
                {PRESET_COLORS.slice(0, 3).map(c => (
                  <button
                    key={c}
                    onClick={() => setNewLabelColor(c)}
                    className={`w-6 h-6 rounded-full border transition-all ${newLabelColor === c ? 'ring-2 ring-blue-400 scale-110' : 'border-white/20'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <Button variant="primary" onClick={handleAddNewLabelToDataset}>
              Add Label
            </Button>
          </div>

          <div className="border-t border-white/10 pt-4">
            <label className="text-xs text-slate-300 font-semibold block mb-2">Existing Labels</label>
            <div className="space-y-2">
              {selectedDataset?.labels.map((l) => (
                <div key={l.id} className="flex justify-between items-center p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                    <span className="font-semibold text-white">{l.name}</span>
                  </div>
                  <span className="text-slate-400 font-medium">{l.sampleCount} samples</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-white/10">
            <Button variant="secondary" onClick={() => setShowLabelModal(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
