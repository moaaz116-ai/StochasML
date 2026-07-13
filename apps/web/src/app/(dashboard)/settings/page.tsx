'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Monitor, 
  Wifi, 
  Bell, 
  Shield, 
  Save, 
  Check, 
  User, 
  Activity, 
  AlertTriangle,
  Play
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useSettingsStore } from '@/stores/settings-store';
import { api } from '@/services/api';
import { toast } from '@/stores/toast-store';

export default function SettingsPage() {
  const store = useSettingsStore();

  // Local settings form state
  const [localUrl, setLocalUrl] = useState('');
  const [localBaud, setLocalBaud] = useState('');
  const [localName, setLocalName] = useState('');
  const [localEmail, setLocalEmail] = useState('');
  const [saved, setSaved] = useState(false);

  // Connection testing state
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'online' | 'offline' | 'idle'; mode?: string } | null>(null);

  // Sync state from store
  useEffect(() => {
    setLocalUrl(store.apiUrl);
    setLocalBaud(store.baudRate.toString());
    setLocalName(store.profileName);
    setLocalEmail(store.profileEmail);
  }, [store]);

  const handleSave = () => {
    // URL Validation
    if (!localUrl.startsWith('http://') && !localUrl.startsWith('https://')) {
      toast.error('API URL must start with http:// or https://');
      return;
    }

    // Baud Rate Validation
    const baud = parseInt(localBaud, 10);
    if (isNaN(baud) || baud < 9600 || baud > 921600) {
      toast.error('Baud rate must be a valid integer between 9600 and 921600.');
      return;
    }

    // Email Validation
    if (localEmail && !localEmail.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    // Save to store and api instance
    store.setApiUrl(localUrl);
    store.setBaudRate(baud);
    store.setProfile(localName, localEmail);
    api.setBaseUrl(localUrl);

    setSaved(true);
    toast.success('System preferences saved and applied.');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // Temporarily use the unsaved URL to test connection
      const tempApi = new (api.constructor as any)();
      tempApi.setBaseUrl(localUrl);
      const health = await tempApi.getHealth();
      
      setTestResult({
        status: 'online',
        mode: health.execution_mode || 'demo'
      });
      toast.success('Infera API server reached successfully!');
    } catch (e) {
      setTestResult({ status: 'offline' });
      toast.error('Could not reach API server. Start backend on port 8000.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Settings</h1>
          <p className="text-slate-400 mt-1">Manage system configurations and developer profile credentials.</p>
        </div>
        <Button 
          variant="primary"
          onClick={handleSave}
          className="px-6"
        >
          {saved ? <Check className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* User Profile */}
        <Card className="p-6 liquid-glass">
          <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
              <User className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">Developer Profile</h2>
              <p className="text-xs text-slate-400">Credentials used for model logs and commits</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Profile Name"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              placeholder="e.g. John Doe"
            />
            <Input
              label="Profile Email"
              type="email"
              value={localEmail}
              onChange={(e) => setLocalEmail(e.target.value)}
              placeholder="e.g. developer@stochas.ai"
            />
          </div>
        </Card>

        {/* API Configuration */}
        <Card className="p-6 liquid-glass">
          <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
              <Monitor className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">API Server Gateway</h2>
              <p className="text-xs text-slate-400">FastAPI backend connection settings</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Input
                  label="Backend API URL"
                  value={localUrl}
                  onChange={(e) => setLocalUrl(e.target.value)}
                  placeholder="http://localhost:8000"
                  helperText="The endpoint host of your FastAPI container."
                />
              </div>
              <Button 
                variant="secondary" 
                onClick={handleTestConnection}
                disabled={testing}
                className="mb-6 h-10"
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </Button>
            </div>

            {testResult && (
              <div className={`p-3 rounded-2xl border text-xs flex justify-between items-center ${
                testResult.status === 'online' 
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${testResult.status === 'online' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  <span>
                    {testResult.status === 'online' 
                      ? `Successfully connected to Stochas ML backend!` 
                      : 'API Server unreachable. Is your local port 8000 open?'}
                  </span>
                </div>
                {testResult.status === 'online' && (
                  <Badge variant={testResult.mode === 'production' ? 'success' : 'warning'}>
                    {testResult.mode === 'production' ? 'Real TensorFlow' : 'Simulated Demo'}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Serial / Device */}
        <Card className="p-6 liquid-glass">
          <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <Wifi className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">Serial Communications</h2>
              <p className="text-xs text-slate-400">USB UART Web Serial speeds</p>
            </div>
          </div>
          <div className="space-y-4">
            <Input
              label="UART Baud Rate"
              type="number"
              value={localBaud}
              onChange={(e) => setLocalBaud(e.target.value)}
              helperText="Serial port connection speed (ESP32 standard: 115200)"
            />
          </div>
        </Card>

        {/* About */}
        <Card className="p-6 liquid-glass">
          <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">About Stochas ML</h2>
              <p className="text-xs text-slate-400">System core parameters</p>
            </div>
          </div>
          <div className="space-y-3 text-xs leading-normal">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Release Version</span>
              <Badge variant="info">v0.2.0-beta</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Compiler Core</span>
              <span className="text-white font-semibold">TensorFlow Lite Micro (v2.16)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">License Model</span>
              <span className="text-white font-semibold">Apache-2.0</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
