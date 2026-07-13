'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Database,
  Search,
  Filter,
  Trash2,
  Edit2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Eye,
  Activity,
  Layers,
  Split,
  X
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';
import { toast } from '@/stores/toast-store';

interface SampleItem {
  id: string;
  dataset_id?: string;
  datasetId?: string;
  filename?: string;
  label: string;
  size?: number;
  duration?: number;
  split?: 'train' | 'test';
  is_disabled?: boolean;
  isDisabled?: boolean;
  data_reference?: string;
  payload?: number[][] | number[];
}

export default function DatasetSampleExplorerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const datasetId = resolvedParams.id;

  const [dataset, setDataset] = useState<any>(null);
  const [samples, setSamples] = useState<SampleItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLabel, setFilterLabel] = useState<string>('all');
  const [filterSplit, setFilterSplit] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Preview Modal
  const [selectedSample, setSelectedSample] = useState<SampleItem | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const fetchDatasetAndSamples = async () => {
    try {
      setLoading(true);
      const currentDs = await api.getDataset(datasetId);
      setDataset(currentDs || null);

      const smpList = await api.getSamples(datasetId);
      setSamples(smpList || []);
    } catch (e: any) {
      toast.error(`Failed to load samples: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectSample = async (sample: SampleItem) => {
    setSelectedSample(sample);
    setPreviewLoading(true);
    setPreviewData(null);
    try {
      const detailedSample = await api.getSample(sample.id);
      setPreviewData(detailedSample);
    } catch (e: any) {
      toast.error(`Failed to load sample preview: ${e.message}`);
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasetAndSamples();
  }, [datasetId]);

  const handleToggleSplit = async (sample: SampleItem) => {
    const currentSplit = sample.split || 'train';
    const nextSplit = currentSplit === 'train' ? 'test' : 'train';
    try {
      await api.updateSample(sample.id, { split: nextSplit });
      setSamples((prev) =>
        prev.map((s) => (s.id === sample.id ? { ...s, split: nextSplit } : s))
      );
      toast.success(`Moved sample to ${nextSplit.toUpperCase()} split.`);
    } catch (e: any) {
      toast.error(`Failed to update split: ${e.message}`);
    }
  };

  const handleToggleDisabled = async (sample: SampleItem) => {
    const currentDisabled = sample.is_disabled ?? sample.isDisabled ?? false;
    const nextDisabled = !currentDisabled;
    try {
      await api.updateSample(sample.id, { is_disabled: nextDisabled });
      setSamples((prev) =>
        prev.map((s) =>
          s.id === sample.id ? { ...s, is_disabled: nextDisabled, isDisabled: nextDisabled } : s
        )
      );
      toast.success(nextDisabled ? 'Sample disabled.' : 'Sample enabled.');
    } catch (e: any) {
      toast.error(`Failed to update status: ${e.message}`);
    }
  };

  const handleDeleteSample = async (sampleId: string) => {
    try {
      await api.deleteSample(sampleId);
      setSamples((prev) => prev.filter((s) => s.id !== sampleId));
      toast.success('Sample deleted.');
    } catch (e: any) {
      toast.error(`Failed to delete sample: ${e.message}`);
    }
  };

  const handleRebalance = async () => {
    try {
      const res = await api.rebalanceDatasetSplit(datasetId, 0.8);
      toast.success(`Rebalanced: ${res.trainCount} train / ${res.testCount} test samples.`);
      await fetchDatasetAndSamples();
    } catch (e: any) {
      toast.error(`Failed to rebalance dataset: ${e.message}`);
    }
  };

  const filteredSamples = samples.filter((s) => {
    const fname = s.filename || s.id;
    const matchesSearch = fname.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.label.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLabel = filterLabel === 'all' || s.label === filterLabel;
    const currentSplit = s.split || 'train';
    const matchesSplit = filterSplit === 'all' || currentSplit === filterSplit;
    const currentDisabled = s.is_disabled ?? s.isDisabled ?? false;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'enabled' && !currentDisabled) ||
      (filterStatus === 'disabled' && currentDisabled);

    return matchesSearch && matchesLabel && matchesSplit && matchesStatus;
  });

  const trainCount = samples.filter((s) => (s.split || 'train') === 'train').length;
  const testCount = samples.filter((s) => s.split === 'test').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/datasets')}>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-serif text-slate-900">
              {dataset?.name || 'Dataset Samples'}
            </h1>
            <p className="text-sm text-slate-500">
              Explore, relabel, inspect, and balance dataset samples across train & test splits.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleRebalance}>
            <Split className="w-4 h-4 mr-1.5 text-blue-600" />
            Auto Rebalance Split (80/20)
          </Button>
          <Button variant="outline" size="sm" onClick={fetchDatasetAndSamples}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Split Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Samples</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{samples.length}</p>
          </div>
          <Database className="w-8 h-8 text-blue-500 opacity-80" />
        </Card>
        <Card className="p-4 bg-white border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Train Split</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {trainCount}{' '}
              <span className="text-xs font-normal text-slate-400">
                ({samples.length ? Math.round((trainCount / samples.length) * 100) : 0}%)
              </span>
            </p>
          </div>
          <Badge variant="success">Train</Badge>
        </Card>
        <Card className="p-4 bg-white border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Test Split</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">
              {testCount}{' '}
              <span className="text-xs font-normal text-slate-400">
                ({samples.length ? Math.round((testCount / samples.length) * 100) : 0}%)
              </span>
            </p>
          </div>
          <Badge variant="info">Test</Badge>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-white border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search filename or label..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterLabel}
            onChange={(e) => setFilterLabel(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Labels</option>
            {Array.from(new Set(samples.map((s) => s.label))).map((lbl) => (
              <option key={lbl} value={lbl}>
                {lbl}
              </option>
            ))}
          </select>

          <select
            value={filterSplit}
            onChange={(e) => setFilterSplit(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Splits</option>
            <option value="train">Train Split</option>
            <option value="test">Test Split</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      </Card>

      {/* Samples Table */}
      <Card className="overflow-hidden border border-slate-200 bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4">Sample / ID</th>
              <th className="py-3 px-4">Label</th>
              <th className="py-3 px-4">Split</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Duration / Size</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  Loading samples...
                </td>
              </tr>
            ) : filteredSamples.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  No samples match current filters.
                </td>
              </tr>
            ) : (
              filteredSamples.map((sample) => {
                const currentSplit = sample.split || 'train';
                const currentDisabled = sample.is_disabled ?? sample.isDisabled ?? false;

                return (
                  <tr key={sample.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-slate-700">
                      {sample.filename || sample.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="default">{sample.label}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleSplit(sample)}
                        className="focus:outline-none"
                      >
                        <Badge variant={currentSplit === 'train' ? 'success' : 'info'}>
                          {currentSplit.toUpperCase()}
                        </Badge>
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleDisabled(sample)}
                        className="focus:outline-none"
                      >
                        {currentDisabled ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                            <XCircle className="w-3.5 h-3.5" /> Disabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Enabled
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {sample.duration ? `${sample.duration}ms` : `${sample.size || 0} bytes`}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleInspectSample(sample)}
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSample(sample.id)}
                      >
                        <Trash2 className="w-4 h-4 text-rose-500" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>

      {/* Preview Modal */}
      {selectedSample && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full p-6 bg-white border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                Sample Preview: {selectedSample.filename || selectedSample.id}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedSample(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-700">
              <div>
                <span className="text-slate-400 block">Filename / ID</span>
                <strong>{selectedSample.filename || selectedSample.id}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Label</span>
                <strong>{selectedSample.label}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Split</span>
                <strong>{(selectedSample.split || 'train').toUpperCase()}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Status</span>
                <strong>{selectedSample.is_disabled || selectedSample.isDisabled ? 'Disabled' : 'Enabled'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Duration</span>
                <strong>{selectedSample.duration || 1000} ms</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Size</span>
                <strong>{selectedSample.size || 0} bytes</strong>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Raw Data Points (Payload)
              </h4>
              {previewLoading ? (
                <div className="bg-slate-900 rounded-lg p-6 text-center text-xs text-slate-400">
                  Loading payload values...
                </div>
              ) : previewData?.payload && Array.isArray(previewData.payload) && previewData.payload.length > 0 ? (
                <div className="bg-slate-900 rounded-lg p-3 font-mono text-[11px] text-emerald-400 max-h-48 overflow-y-auto border border-slate-800">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500">
                        <th className="py-1 px-2">Sample #</th>
                        <th className="py-1 px-2">Values</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.payload.slice(0, 50).map((row: any, idx: number) => (
                        <tr key={idx} className="border-b border-slate-800/50">
                          <td className="py-1 px-2 text-slate-400">{idx + 1}</td>
                          <td className="py-1 px-2">
                            {Array.isArray(row) ? row.map((v: any) => Number(v).toFixed(3)).join(', ') : String(row)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.payload.length > 50 && (
                    <div className="text-center text-slate-500 pt-2">
                      Showing first 50 of {previewData.payload.length} points
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-slate-400 text-center">
                  No payload values recorded for this sample.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setSelectedSample(null)}>Close</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
