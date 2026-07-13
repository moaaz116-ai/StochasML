'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, 
  AlertTriangle,
  Play,
  Settings2,
  Box,
  BarChart3,
  ListFilter,
  XCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useProjectStore } from '@/stores/project-store';
import { toast } from '@/stores/toast-store';
import { api } from '@/services/api';

function ModelTestingContent() {
  const router = useRouter();
  const { activeProject, models } = useProjectStore();
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [modelVariant, setModelVariant] = useState<'float32' | 'int8'>('int8');
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.6);
  const [isTesting, setIsTesting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const filteredModels = activeProject
    ? models.filter((m) => m.projectId === activeProject.id)
    : [];

  const handleRunTest = async () => {
    if (!selectedModelId) return;
    setIsTesting(true);
    setResults(null);
    setTestError(null);
    
    try {
      const data = await api.testModel(selectedModelId, {
        variant: modelVariant,
        confidenceThreshold,
      });
      setResults(data);
      toast.success('Classification test completed.');
    } catch (err: any) {
      const msg = err?.message || 'Unknown error during model testing';
      setTestError(msg);
      toast.error(`Model test failed: ${msg}`);
    } finally {
      setIsTesting(false);
    }
  };

  if (!activeProject) {
    return (
      <Card className="p-8 text-center border-slate-200 bg-white shadow-sm space-y-4">
        <Box className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">No Active Project Workspace</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Choose a workspace under Projects first to test models.
        </p>
      </Card>
    );
  }

  if (filteredModels.length === 0) {
    return (
      <EmptyState
        icon={Box}
        title="No Models Available"
        description="Train a model first before running tests."
      />
    );
  }

  const maxMatrixVal = results ? Math.max(...(results.matrix || []).flatMap((row: any) => Object.values(row.predicted) as number[]), 1) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-serif">Model Testing</h1>
        <p className="text-slate-500 mt-1">Evaluate model performance against your test dataset split.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config Panel */}
        <Card className="p-5 border-slate-200 bg-white shadow-sm space-y-6 lg:col-span-1 h-fit">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center">
              <Settings2 className="w-4 h-4 mr-2 text-slate-500" />
              Test Configuration
            </h3>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Model</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
              >
                <option value="">-- Choose trained model --</option>
                {filteredModels.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} (Acc: {(m.accuracy * 100).toFixed(1)}%)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Model Variant</label>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${modelVariant === 'float32' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setModelVariant('float32')}
                >
                  Float32
                </button>
                <button 
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${modelVariant === 'int8' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setModelVariant('int8')}
                >
                  INT8 (Quantized)
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confidence Threshold</label>
                <span className="text-xs font-mono text-slate-600 bg-slate-100 px-1.5 rounded">{confidenceThreshold.toFixed(2)}</span>
              </div>
              <input 
                type="range" 
                min="0.1" max="0.95" step="0.05" 
                value={confidenceThreshold} 
                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
            
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-500 text-white" 
              onClick={handleRunTest}
              disabled={!selectedModelId || isTesting}
            >
              <Play className="w-4 h-4 mr-2" />
              {isTesting ? 'Running Inference...' : 'Run Classification Test'}
            </Button>
          </div>
        </Card>

        {/* Results Area */}
        <div className="lg:col-span-2 space-y-6">
          {testError && (
            <Card className="p-6 border-rose-200 bg-rose-50 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-rose-800 text-sm mb-1">Test Failed</h4>
                <p className="text-rose-700 text-xs">{testError}</p>
              </div>
            </Card>
          )}

          {!results && !isTesting && !testError ? (
            <Card className="p-12 text-center border-slate-200 bg-white/50 border-dashed flex flex-col items-center justify-center h-full min-h-[400px]">
              <BarChart3 className="w-12 h-12 text-slate-200 mb-4" />
              <p className="text-slate-500 text-sm">Select a model and run tests to see the confusion matrix and metrics.</p>
            </Card>
          ) : isTesting ? (
            <Card className="p-12 text-center border-slate-200 bg-white flex flex-col items-center justify-center h-full min-h-[400px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-slate-600 font-medium">Running inference on test split...</p>
              <p className="text-xs text-slate-400 mt-2">This may take a few seconds</p>
            </Card>
          ) : results ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 border-slate-200 bg-white shadow-sm flex flex-col justify-center items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Test Accuracy</span>
                  <span className="text-3xl font-bold text-emerald-600">{((results.accuracy || 0) * 100).toFixed(1)}%</span>
                </Card>
                <Card className="p-4 border-slate-200 bg-white shadow-sm flex flex-col justify-center items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">F1 Score</span>
                  <span className="text-3xl font-bold text-blue-600">{(results.f1Score || results.f1_score || 0).toFixed(2)}</span>
                </Card>
                <Card className="p-4 border-slate-200 bg-white shadow-sm flex flex-col justify-center items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Samples Tested</span>
                  <span className="text-3xl font-bold text-slate-800">{results.totalSamples || results.total_samples || 0}</span>
                </Card>
              </div>

              {results.matrix && results.matrix.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-5 border-slate-200 bg-white shadow-sm overflow-x-auto">
                    <h3 className="font-bold text-slate-800 mb-4 text-sm">Confusion Matrix</h3>
                    <table className="text-xs text-center border-collapse">
                      <thead>
                        <tr>
                          <td colSpan={2} rowSpan={2}></td>
                          <th colSpan={Object.keys(results.matrix[0]?.predicted || {}).length} className="pb-2 text-slate-500 font-semibold border-b border-slate-100">Predicted Class</th>
                        </tr>
                        <tr>
                          {Object.keys(results.matrix[0]?.predicted || {}).map((label: string) => (
                            <th key={label} className="p-2 font-medium text-slate-600 border-b border-slate-100">{label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.matrix.map((row: any, i: number) => (
                          <tr key={row.trueLabel || row.true_label}>
                            {i === 0 && <th rowSpan={results.matrix.length} className="pr-2 align-middle text-slate-500 font-semibold border-r border-slate-100" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>True Class</th>}
                            <th className="p-2 font-medium text-slate-600 text-right border-r border-slate-100">{row.trueLabel || row.true_label}</th>
                            {Object.entries(row.predicted).map(([pLabel, count]: [string, any]) => {
                              const isCorrect = (row.trueLabel || row.true_label) === pLabel;
                              const intensity = count / maxMatrixVal;
                              return (
                                <td 
                                  key={pLabel} 
                                  className={`p-3 font-mono font-semibold border border-white ${isCorrect ? 'text-emerald-900' : 'text-rose-900'}`}
                                  style={{
                                    backgroundColor: isCorrect 
                                      ? `rgba(16, 185, 129, ${Math.max(0.1, intensity)})` 
                                      : `rgba(244, 63, 94, ${Math.max(0.05, intensity)})`
                                  }}
                                >
                                  {count}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>

                  {results.classes && results.classes.length > 0 && (
                    <Card className="p-5 border-slate-200 bg-white shadow-sm overflow-x-auto">
                      <h3 className="font-bold text-slate-800 mb-4 text-sm">Class Performance</h3>
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                          <tr>
                            <th className="p-2 font-semibold">Label</th>
                            <th className="p-2 font-semibold">Precision</th>
                            <th className="p-2 font-semibold">Recall</th>
                            <th className="p-2 font-semibold">F1</th>
                            <th className="p-2 font-semibold">Support</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {results.classes.map((c: any) => (
                            <tr key={c.name} className="hover:bg-slate-50/50">
                              <td className="p-2 font-medium text-slate-700">{c.name}</td>
                              <td className="p-2 font-mono text-slate-600">{(c.precision || 0).toFixed(2)}</td>
                              <td className="p-2 font-mono text-slate-600">{(c.recall || 0).toFixed(2)}</td>
                              <td className="p-2 font-mono text-slate-600">{(c.f1 || 0).toFixed(2)}</td>
                              <td className="p-2 font-mono text-slate-500">{c.support || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Card>
                  )}
                </div>
              )}

              {results.misclassified && results.misclassified.length > 0 && (
                <Card className="p-0 border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center">
                      <ListFilter className="w-4 h-4 mr-2 text-rose-500" />
                      Misclassified Samples
                    </h3>
                    <Badge variant="warning">{results.misclassified.length} items</Badge>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {results.misclassified.map((m: any) => (
                      <div key={m.id || m.sample_id} className="p-3 flex justify-between items-center hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">{m.id || m.sample_id}</span>
                          <div className="flex items-center text-xs">
                            <span className="text-emerald-600 font-semibold">{m.expected || m.true_label}</span>
                            <span className="mx-2 text-slate-300">&#8594;</span>
                            <span className="text-rose-600 font-semibold">{m.predicted}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-slate-500">{((m.confidence || 0) * 100).toFixed(1)}%</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[11px] h-7 px-2"
                            onClick={() => {
                              toast.info(`Inspecting sample ${m.id || m.sample_id}`);
                              router.push(`/datasets`);
                            }}
                          >
                            Inspect
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function ModelTestingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 animate-pulse">Loading testing dashboard...</div>}>
      <ModelTestingContent />
    </Suspense>
  );
}
