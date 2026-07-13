'use client';

import { useState } from 'react';
import { 
  FolderPlus, 
  FolderOpen, 
  Database, 
  Box, 
  Rocket, 
  Edit, 
  Trash2, 
  Archive,
  Info,
  CheckCircle2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { useProjectStore } from '@/stores/project-store';
import { DataType, type Project, DeploymentTarget } from '@/lib/types';
import { toast } from '@/stores/toast-store';

export default function ProjectsPage() {
  const { 
    projects, 
    activeProject, 
    setActiveProject, 
    createProject, 
    updateProject, 
    deleteProject 
  } = useProjectStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [targetBoard, setTargetBoard] = useState('esp32-s3');
  const [sampleRate, setSampleRate] = useState(50);
  const [channelCount, setChannelCount] = useState(3);
  const [channelNames, setChannelNames] = useState('accel_x, accel_y, accel_z');

  const openCreateModal = () => {
    setName('');
    setDesc('');
    setTargetBoard('esp32-s3');
    setSampleRate(50);
    setChannelCount(3);
    setChannelNames('accel_x, accel_y, accel_z');
    setShowCreateModal(true);
  };

  const openEditModal = (p: Project) => {
    setEditingProjectId(p.id);
    setName(p.name);
    setDesc(p.description);
    setTargetBoard(p.targetBoard || 'esp32-s3');
    setSampleRate(p.sampleRate || 50);
    setChannelCount(p.channelCount || 3);
    setChannelNames((p.channelNames || ['accel_x', 'accel_y', 'accel_z']).join(', '));
    setShowEditModal(true);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Project name is required.');
      return;
    }

    const channels = channelNames.split(',').map(s => s.trim()).filter(Boolean);
    if (channels.length !== channelCount) {
      toast.error(`Channel names count (${channels.length}) must match the specified channel count (${channelCount}).`);
      return;
    }

    try {
      const p = await createProject({
        name: name.trim(),
        description: desc.trim(),
        targetBoard,
        sampleRate,
        channelCount,
        channelNames: channels,
        archived: false,
      });

      if (p) {
        toast.success(`Project "${p.name}" created successfully!`);
        setShowCreateModal(false);
      }
    } catch (e: any) {
      toast.error(`Failed to create project: ${e.message}`);
    }
  };

  const handleUpdate = async () => {
    if (!name.trim() || !editingProjectId) {
      toast.error('Project name is required.');
      return;
    }

    const channels = channelNames.split(',').map(s => s.trim()).filter(Boolean);
    if (channels.length !== channelCount) {
      toast.error(`Channel names count (${channels.length}) must match the specified channel count (${channelCount}).`);
      return;
    }

    try {
      const p = await updateProject(editingProjectId, {
        name: name.trim(),
        description: desc.trim(),
        targetBoard,
        sampleRate,
        channelCount,
        channelNames: channels,
      });

      if (p) {
        toast.success(`Project "${p.name}" updated successfully!`);
        setShowEditModal(false);
      }
    } catch (e: any) {
      toast.error(`Failed to update project: ${e.message}`);
    }
  };

  const handleDelete = (id: string, name: string) => {
    setProjectToDelete({ id, name });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      const ok = await deleteProject(projectToDelete.id);
      if (ok) {
        toast.success(`Project "${projectToDelete.name}" deleted.`);
      }
    } catch (e: any) {
      toast.error(`Failed to delete project: ${e.message}`);
    } finally {
      setShowDeleteModal(false);
      setProjectToDelete(null);
    }
  };

  const handleToggleArchive = async (p: Project) => {
    const nextArchived = !p.archived;
    try {
      await updateProject(p.id, { archived: nextArchived });
      toast.success(nextArchived ? `Project "${p.name}" archived.` : `Project "${p.name}" unarchived.`);
    } catch (e: any) {
      toast.error(`Failed to toggle archive status: ${e.message}`);
    }
  };

  const dataTypeColors: Record<string, 'info' | 'success' | 'warning' | 'error' | 'default'> = {
    sensor: 'info',
    audio: 'success',
    image: 'warning',
    custom: 'default',
  };

  const activeProjects = projects.filter(p => !p.archived);
  const archivedProjects = projects.filter(p => p.archived);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Projects</h1>
          <p className="text-slate-400 mt-1">Manage your TinyML projects and hardware targets.</p>
        </div>
        <Button variant="primary" onClick={openCreateModal} className="shadow-md">
          <FolderPlus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={FolderOpen}
            title="No projects found"
            description="Create a project to organize your datasets and trained models."
            action={<Button variant="primary" onClick={openCreateModal}>Create Project</Button>}
          />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Projects */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Active Workspaces</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeProjects.map((project) => (
                <Card
                  key={project.id}
                  className={`p-5 relative transition-all flex flex-col justify-between h-56 ${
                    activeProject?.id === project.id
                      ? 'ring-2 ring-blue-500/80 border-blue-500/60 bg-blue-500/15'
                      : 'liquid-glass hover:liquid-glass-interactive'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveProject(project)}>
                        <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                          <FolderOpen className="w-4 h-4 text-blue-400" />
                        </div>
                        <h3 className="font-bold text-white text-sm hover:underline">{project.name}</h3>
                      </div>
                      <Badge variant={dataTypeColors[project.dataType] || 'default'}>
                        {project.dataType}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed" onClick={() => setActiveProject(project)}>
                      {project.description}
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Board: {project.targetBoard || 'esp32-s3'} | {project.sampleRate || 50}Hz
                    </div>
                  </div>

                  <div className="space-y-3.5 mt-4">
                    <div className="flex items-center gap-4 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Database className="w-3.5 h-3.5 text-blue-400" /> {project.datasetCount || 0} datasets
                      </span>
                      <span className="flex items-center gap-1">
                        <Box className="w-3.5 h-3.5 text-cyan-400" /> {project.modelCount || 0} models
                      </span>
                      <span className="flex items-center gap-1">
                        <Rocket className="w-3.5 h-3.5 text-indigo-400" /> {project.deploymentCount || 0} deploys
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/10 pt-3">
                      {activeProject?.id === project.id ? (
                        <Badge variant="success">Active Workspace</Badge>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => setActiveProject(project)} className="text-xs p-0 text-blue-400 hover:text-blue-300">
                          Select Workspace
                        </Button>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-white" onClick={(e) => { e.stopPropagation(); openEditModal(project); }}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-blue-400" onClick={(e) => { e.stopPropagation(); handleToggleArchive(project); }}>
                          <Archive className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-rose-400" onClick={(e) => { e.stopPropagation(); handleDelete(project.id, project.name); }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            {/* Guided Onboarding Checklist for Active Project */}
            {activeProject && (
              <div className="mt-8">
                <Card className="p-6 border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 backdrop-blur-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300">
                      <Rocket className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-bold text-white">Workspace Onboarding Guide</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2 relative">
                    {/* Progress Line */}
                    <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-blue-500/30 -z-10 -translate-y-1/2" />
                    
                    {[
                      { step: 1, name: 'Collect Data', desc: 'Upload CSVs or record sensors.', link: '/datasets', active: activeProject.datasetCount === 0, done: activeProject.datasetCount! > 0 },
                      { step: 2, name: 'Design Impulse', desc: 'Configure DSP and learning blocks.', link: '/impulse', active: activeProject.datasetCount! > 0 && !activeProject.impulseConfig, done: !!activeProject.impulseConfig },
                      { step: 3, name: 'Train Model', desc: 'Train the neural network.', link: '/training', active: !!activeProject.impulseConfig && activeProject.modelCount === 0, done: activeProject.modelCount! > 0 },
                      { step: 4, name: 'Test Accuracy', desc: 'Verify against test splits.', link: '/model-testing', active: activeProject.modelCount! > 0, done: false },
                      { step: 5, name: 'Deploy Firmware', desc: 'Build PlatformIO target.', link: '/deployments', active: activeProject.modelCount! > 0, done: activeProject.deploymentCount! > 0 }
                    ].map((step, idx) => (
                      <div key={idx} className="flex flex-col items-center text-center p-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-3 transition-all ${
                          step.done ? 'bg-emerald-500 text-white shadow-sm ring-4 ring-emerald-500/30' :
                          step.active ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-500/40 scale-110' :
                          'bg-white/5 text-slate-400 border border-white/10'
                        }`}>
                          {step.done ? <CheckCircle2 className="w-5 h-5" /> : step.step}
                        </div>
                        <h4 className={`text-xs font-bold mb-1 ${step.active || step.done ? 'text-white' : 'text-slate-400'}`}>{step.name}</h4>
                        <p className="text-[10px] text-slate-400 mb-2 leading-snug hidden md:block">{step.desc}</p>
                        <Button 
                          variant={step.active ? "primary" : "secondary"}
                          size="sm"
                          className="h-6 text-[10px] px-2 w-full max-w-[100px]"
                          onClick={() => window.location.href = step.link}
                        >
                          {step.done ? 'View' : 'Start'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Archived Projects Section */}
          {archivedProjects.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-white/10">
              <h2 className="text-xl font-bold text-slate-400">Archived Workspaces</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 opacity-70">
                {archivedProjects.map((project) => (
                  <Card key={project.id} className="p-5 border-dashed border-white/20 bg-white/5 flex flex-col justify-between h-48">
                    <div>
                      <h3 className="font-bold text-white text-sm">{project.name} (Archived)</h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{project.description}</p>
                    </div>
                    <div className="flex justify-between items-center border-t border-white/10 pt-3">
                      <Button variant="secondary" size="sm" onClick={() => handleToggleArchive(project)} className="text-xs">
                        Restore Project
                      </Button>
                      <button 
                        onClick={() => handleDelete(project.id, project.name)}
                        className="p-1.5 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      <Modal
        open={showCreateModal || showEditModal}
        onClose={() => { setShowCreateModal(false); setShowEditModal(false); }}
        title={showCreateModal ? "Create New Project" : "Edit Project Config"}
        description={showCreateModal ? "Define target sensor metadata and board spec." : "Modify your project settings."}
      >
        <div className="space-y-4">
          <Input
            label="Project Name"
            placeholder="e.g. Gesture Classifier"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Description"
            placeholder="Describe your TinyML model objective"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-300 font-semibold">Target Hardware Board</label>
              <select 
                value={targetBoard}
                onChange={(e) => setTargetBoard(e.target.value)}
                className="bg-[#0e1424] border border-white/20 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="esp32-s3">ESP32-S3</option>
                <option value="esp32">ESP32 (Standard)</option>
                <option value="arduino-nano-33">Arduino Nano 33 BLE</option>
                <option value="raspberry-pi-pico">Raspberry Pi Pico</option>
                <option value="generic">Generic Microcontroller</option>
              </select>
            </div>
            
            <Input
              label="Sample Rate (Hz)"
              type="number"
              value={sampleRate}
              onChange={(e) => setSampleRate(Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 items-end">
            <div className="col-span-1">
              <Input
                label="Sensor Channels"
                type="number"
                value={channelCount}
                onChange={(e) => setChannelCount(Number(e.target.value))}
              />
            </div>
            <div className="col-span-2">
              <Input
                label="Channel Names (comma separated)"
                placeholder="e.g. ax, ay, az"
                value={channelNames}
                onChange={(e) => setChannelNames(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button variant="ghost" onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}>
              Cancel
            </Button>
            <Button 
              variant="primary"
              onClick={showCreateModal ? handleCreate : handleUpdate}
              disabled={!name.trim()}
            >
              {showCreateModal ? 'Create Project' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Delete Project"
        description="Are you absolutely sure you want to delete this project? All associated datasets, models, and deployments will be permanently deleted. This action cannot be undone."
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Permanently Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
