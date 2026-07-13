'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FolderOpen, 
  Database, 
  Activity, 
  BrainCircuit, 
  Box, 
  Rocket, 
  Settings,
  Menu,
  Cpu,
  LayoutDashboard,
  Wifi,
  WifiOff,
  AlertTriangle,
  RefreshCw,
  Settings2,
  ShieldAlert,
  Play,
  Phone,
  Mail
} from 'lucide-react';
import { useUiStore } from '@/stores/ui-store';
import { useProjectStore } from '@/stores/project-store';
import { useSettingsStore } from '@/stores/settings-store';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
}

function NavItem({ href, icon: Icon, label, isActive }: NavItemProps) {
  return (
    <Link 
      href={href}
      className={cn(
        "flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium",
        isActive 
          ? "bg-gradient-to-r from-blue-600/25 to-cyan-500/15 text-white border border-blue-500/30 shadow-sm shadow-blue-500/10 backdrop-blur-md" 
          : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
      )}
    >
      <Icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", isActive ? "text-blue-400" : "text-slate-400 group-hover:text-slate-200")} />
      <span>{label}</span>
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, setTheme } = useUiStore();
  const { activeProject, fetchProjects, fetchDatasets, fetchModels, fetchDeployments } = useProjectStore();
  const { profileName, profileEmail, apiUrl } = useSettingsStore();

  const [backendStatus, setBackendStatus] = useState<{
    status: 'online' | 'offline' | 'checking';
    mode?: string;
  }>({ status: 'checking' });

  // Check health and poll
  const checkHealth = async () => {
    try {
      const res = await api.getHealth();
      const nextMode = res.execution_mode || 'demo';
      setBackendStatus(prev => {
        if (prev.status === 'online' && prev.mode === nextMode) return prev;
        return { status: 'online', mode: nextMode };
      });
    } catch (e) {
      setBackendStatus(prev => {
        if (prev.status === 'offline') return prev;
        return { status: 'offline' };
      });
    }
  };

  useEffect(() => {
    // Default to dark mode class
    document.documentElement.classList.add('dark');
    setTheme('dark');
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (activeProject) {
      fetchDatasets(activeProject.id);
      fetchModels(activeProject.id);
      fetchDeployments(activeProject.id);
    }
  }, [activeProject?.id]);

  // Adjust sidebar state on mobile mount
  useEffect(() => {
    if (window.innerWidth < 1024 && sidebarOpen) {
      toggleSidebar();
    }
  }, []);

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { href: '/projects', icon: FolderOpen, label: 'Projects' },
    { href: '/datasets', icon: Database, label: 'Datasets' },
    { href: '/impulse', icon: Settings2, label: 'Impulse Design' },
    { href: '/recording', icon: Activity, label: 'Recording' },
    { href: '/training', icon: BrainCircuit, label: 'Training' },
    { href: '/model-testing', icon: ShieldAlert, label: 'Model Testing' },
    { href: '/live-classification', icon: Play, label: 'Live Classification' },
    { href: '/models', icon: Box, label: 'Models' },
    { href: '/deployments', icon: Rocket, label: 'Deployments' },
    { href: '/device-lab', icon: Cpu, label: 'Device Lab' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map(p => p[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="flex h-screen liquid-canvas text-slate-100 overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-[#0d1222]/75 backdrop-blur-2xl border-r border-white/10 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img src="/Logo1.png" alt="Stochas ML Logo" decoding="async" className="w-8 h-8 rounded object-contain drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-300">
              Stochas ML
            </span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3.5 space-y-1.5">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={pathname.startsWith(item.href)}
            />
          ))}
        </nav>
        
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-sm font-semibold text-white shadow-inner">
               {getInitials(profileName)}
             </div>
             <div className="flex flex-col overflow-hidden">
               <span className="text-sm font-medium text-white truncate">{profileName}</span>
               <span className="text-xs text-slate-400 truncate">{profileEmail}</span>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Ambient liquid lighting blobs */}
        <div className="absolute top-10 left-1/4 w-[420px] h-[420px] bg-blue-500/10 rounded-full blur-[130px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-10 right-1/4 w-[420px] h-[420px] bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none" />

        {/* Offline Banner */}
        {backendStatus.status === 'offline' && (
          <div className="bg-rose-950/80 border-b border-rose-500/30 text-rose-200 px-4 py-2.5 text-sm flex items-center gap-2.5 z-20 backdrop-blur-md">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <div className="flex-1">
              <strong>Offline Mode</strong>: API server is unreachable at <code className="bg-rose-900/60 px-1.5 py-0.5 rounded font-mono text-xs border border-rose-500/30">{apiUrl}</code>. 
              Please start the FastAPI backend on <code className="bg-rose-900/60 px-1.5 py-0.5 rounded font-mono text-xs border border-rose-500/30">localhost:8000</code> to enable TinyML operations.
            </div>
            <button 
              onClick={checkHealth}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-rose-200 text-xs px-3 py-1.5 rounded-lg border border-rose-500/30 font-medium transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Connection
            </button>
          </div>
        )}

        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-[#0d1222]/60 backdrop-blur-2xl z-10">
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3.5 ml-auto">
             {/* Health Indicator Badge */}
             {backendStatus.status === 'checking' && (
               <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-slate-300 border border-white/10 backdrop-blur-md">
                 <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
                 Checking API...
               </span>
             )}
             {backendStatus.status === 'online' && (
               <span className={cn(
                 "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-md",
                 backendStatus.mode === 'production' 
                   ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" 
                   : "bg-amber-500/15 text-amber-300 border-amber-500/30"
               )}>
                 <span className={cn(
                   "w-2 h-2 rounded-full animate-pulse",
                   backendStatus.mode === 'production' ? "bg-emerald-400" : "bg-amber-400"
                 )} />
                 Online ({backendStatus.mode === 'production' ? 'Production Mode' : 'Demo Mode'})
               </span>
             )}
             {backendStatus.status === 'offline' && (
               <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30 backdrop-blur-md">
                 <span className="w-2 h-2 rounded-full bg-rose-400" />
                 API Offline
               </span>
             )}

             {activeProject && (
               <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 backdrop-blur-md">
                 Project: {activeProject.name}
               </span>
             )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 z-10 flex flex-col justify-between">
          <div className="max-w-6xl mx-auto w-full">
             {children}
          </div>

          {/* Dashboard Contact & Support Bar */}
          <footer className="mt-12 max-w-6xl mx-auto w-full border-t border-white/10 pt-6 pb-2 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">Stochas ML</span>
              <span>&bull;</span>
              <span>Lead Developer: Moaz Abdellatif</span>
            </div>
            <div className="flex items-center gap-5 font-mono">
              <a href="tel:+201096264652" className="flex items-center gap-1.5 hover:text-white transition-colors">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                +201096264652
              </a>
              <a href="mailto:moaz.abdellatif2009@gmail.com" className="flex items-center gap-1.5 hover:text-white transition-colors">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                moaz.abdellatif2009@gmail.com
              </a>
            </div>
          </footer>
        </main>
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}
