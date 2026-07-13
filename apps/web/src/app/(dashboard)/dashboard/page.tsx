'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Cpu, 
  FolderKanban, 
  Database, 
  BrainCircuit, 
  Rocket, 
  PlayCircle,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  Activity,
  WifiOff
} from 'lucide-react';
import { useProjectStore } from '@/stores/project-store';
import { useSettingsStore } from '@/stores/settings-store';
import { api } from '@/services/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getChannelNames } from '@/lib/utils';

export default function DashboardOverview() {
  const { activeProject, projects, datasets, models, deployments } = useProjectStore();
  const { apiUrl } = useSettingsStore();
  const [backendHealth, setBackendHealth] = useState<{
    status: 'online' | 'offline' | 'checking';
    mode?: string;
    version?: string;
  }>({ status: 'checking' });

  const fetchHealth = async () => {
    try {
      const res = await api.getHealth();
      setBackendHealth({
        status: 'online',
        mode: res.execution_mode || 'demo',
        version: res.version
      });
    } catch {
      setBackendHealth({ status: 'offline' });
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  // Logic to determine recommended next action
  const getNextAction = () => {
    if (projects.length === 0) {
      return {
        title: 'Create Your First Project',
        description: 'Define your sensor configuration and target board spec.',
        href: '/projects',
        label: 'Go to Projects',
        icon: FolderKanban,
      };
    }
    if (!activeProject) {
      return {
        title: 'Select Active Project',
        description: 'Choose a project to start collecting sensor data and training models.',
        href: '/projects',
        label: 'Select Project',
        icon: FolderKanban,
      };
    }
    if (datasets.length === 0) {
      return {
        title: 'Create a Dataset',
        description: 'Add a dataset to start collecting or uploading gesture samples.',
        href: '/datasets',
        label: 'Create Dataset',
        icon: Database,
      };
    }
    const currentDataset = datasets.find(d => d.projectId === activeProject.id || (d as any).project_id === activeProject.id);
    if (!currentDataset) {
      return {
        title: 'Create Project Dataset',
        description: 'Add a dataset mapped to your active project target.',
        href: '/datasets',
        label: 'Create Dataset',
        icon: Database,
      };
    }
    if (models.length === 0) {
      return {
        title: 'Collect or Train Model',
        description: 'Open the Recording tab to stream serial telemetry, or start model training.',
        href: '/training',
        label: 'Go to Training',
        icon: BrainCircuit,
      };
    }
    return {
      title: 'Deploy to Hardware',
      description: 'Generate production-ready C++ firmware and PlatformIO configs for your board.',
      href: '/deployments',
      label: 'Go to Deployments',
      icon: Rocket,
    };
  };

  const stats = [
    { label: 'Projects', value: projects.length, icon: FolderKanban, color: 'text-blue-400', bg: 'bg-blue-500/15 border border-blue-500/30' },
    { label: 'Datasets', value: datasets.length, icon: Database, color: 'text-emerald-400', bg: 'bg-emerald-500/15 border border-emerald-500/30' },
    { label: 'Trained Models', value: models.length, icon: BrainCircuit, color: 'text-indigo-400', bg: 'bg-indigo-500/15 border border-indigo-500/30' },
    { label: 'Active Deployments', value: deployments.length, icon: Rocket, color: 'text-cyan-400', bg: 'bg-cyan-500/15 border border-cyan-500/30' },
  ];

  const recommendedAction = getNextAction();
  const RecommendedIcon = recommendedAction.icon;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            System Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time telemetry, model experimentation, and embedded AI deployments.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} hover className="p-6 flex items-center gap-4">
              <div className={`p-3.5 rounded-2xl ${s.bg} backdrop-blur-md shadow-inner`}>
                <Icon className={`w-6 h-6 ${s.color}`} />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{s.label}</span>
                <h3 className="text-2xl font-extrabold text-white mt-0.5">{s.value}</h3>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommended Action */}
        <Card className="lg:col-span-2 p-7 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
          <div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider backdrop-blur-md">
              Recommended Next Action
            </span>
            <div className="flex gap-4 mt-6">
              <div className="p-3.5 bg-blue-500/15 border border-blue-500/30 rounded-2xl shrink-0 h-fit backdrop-blur-md">
                <RecommendedIcon className="w-8 h-8 text-blue-400" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-white">{recommendedAction.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{recommendedAction.description}</p>
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <Link href={recommendedAction.href}>
              <Button variant="primary" className="shadow-lg">
                {recommendedAction.label} <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* API Info & Connection Status */}
        <Card className="p-7 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" /> API Server Connection
            </h3>
            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">API Endpoint</span>
                <code className="bg-white/10 px-2.5 py-1 rounded-lg font-mono text-xs text-slate-200 border border-white/10">{apiUrl}</code>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Connection Status</span>
                {backendHealth.status === 'online' ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <CheckCircle className="w-4 h-4" /> Connected
                  </span>
                ) : backendHealth.status === 'offline' ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 animate-pulse">
                    <WifiOff className="w-4 h-4" /> Disconnected
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Checking...</span>
                )}
              </div>
              {backendHealth.status === 'online' && (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Execution Mode</span>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase border backdrop-blur-md ${
                      backendHealth.mode === 'production' 
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}>
                      {backendHealth.mode}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Backend Version</span>
                    <span className="text-slate-200 text-xs font-mono">{backendHealth.version || 'v0.1.0'}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          {backendHealth.status === 'offline' ? (
            <div className="mt-6 p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-200 leading-normal backdrop-blur-md">
              Backend server is currently offline. Start the FastAPI server on <code className="font-mono">localhost:8000</code> to connect.
            </div>
          ) : (
            <div className="mt-6 flex justify-end">
              <Button variant="secondary" size="sm" onClick={fetchHealth}>
                <Activity className="w-3.5 h-3.5" /> Refresh Status
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Selected Project Stats */}
      {activeProject ? (
        <Card className="p-7 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
              <Cpu className="w-5 h-5 text-blue-400" /> Active Project Settings
            </h3>
            <span className="text-xs font-semibold text-slate-300 bg-white/10 border border-white/10 px-3 py-1 rounded-full font-mono">
              ID: {activeProject.id}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Project Name</span>
              <p className="text-base font-bold text-white">{activeProject.name}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Target Board</span>
              <p className="text-base font-bold text-white">{(activeProject as any).targetBoard || 'ESP32-S3'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Sampling Frequency</span>
              <p className="text-base font-bold text-white">{(activeProject as any).sampleRate || 50} Hz</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Sensor Channels</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {getChannelNames(activeProject).map((ch: string) => (
                  <span key={ch} className="bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs px-2.5 py-0.5 rounded-lg font-mono backdrop-blur-md">
                    {ch}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto backdrop-blur-md">
            <FolderKanban className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-white">No Active Project Selected</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Choose an active project to enable telemetry streams, dataset definitions, and build runs.
          </p>
          <Link href="/projects">
            <Button variant="primary">
              Go to Projects
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
