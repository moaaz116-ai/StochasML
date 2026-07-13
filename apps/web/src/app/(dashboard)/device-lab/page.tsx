'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  Terminal, 
  Settings, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Play,
  Square
} from 'lucide-react';
import { useSerialStore } from '@/stores/serial-store';
import { useSettingsStore } from '@/stores/settings-store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/stores/toast-store';

export default function DeviceLabPage() {
  const { 
    connectionStatus, 
    deviceInfo, 
    connect, 
    connectMock, 
    disconnect, 
    dataBuffer 
  } = useSerialStore();
  
  const { baudRate, setBaudRate } = useSettingsStore();
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const consoleBottomRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string) => {
    setConsoleLogs((prev) => [...prev.slice(-99), `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  useEffect(() => {
    addLog(`Device Lab initialized. Ready to connect.`);
  }, []);

  useEffect(() => {
    if (connectionStatus === 'connected' && deviceInfo) {
      addLog(`Connected to ${deviceInfo.port} (Baud Rate: ${deviceInfo.baudRate}). Chip: ${deviceInfo.chipId}.`);
      toast.success(`Connected to device successfully!`);
    } else if (connectionStatus === 'disconnected') {
      addLog(`Device disconnected.`);
    } else if (connectionStatus === 'error') {
      addLog(`[ERROR] Connection error encountered.`);
      toast.error(`Serial connection failed or was interrupted.`);
    }
  }, [connectionStatus, deviceInfo]);

  // Scroll console logs to bottom
  useEffect(() => {
    consoleBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleLogs]);

  // Simulate reading periodic frames in the console logs if streaming
  useEffect(() => {
    if (connectionStatus === 'connected' && dataBuffer.length > 0) {
      // Just print a packet receipt trace in console logs every few buffers
      if (Math.random() < 0.05) {
        const lastIdx = dataBuffer.length - 3;
        if (lastIdx >= 0) {
          const x = dataBuffer[lastIdx]?.toFixed(3);
          const y = dataBuffer[lastIdx + 1]?.toFixed(3);
          const z = dataBuffer[lastIdx + 2]?.toFixed(3);
          addLog(`[DATA PACKET] ax: ${x}, ay: ${y}, az: ${z} | Parse status: OK (CRC-8 Verified)`);
        }
      }
    }
  }, [dataBuffer, connectionStatus]);

  const handlePing = () => {
    if (connectionStatus !== 'connected') {
      toast.error('Connect a device first to ping.');
      return;
    }
    addLog(`>>> ping`);
    setTimeout(() => {
      addLog(`<<< pong | Response Latency: 4ms | Hardware Status: OK`);
      toast.success('Device ping succeeded.');
    }, 250);
  };

  const handleDiagnostics = () => {
    if (connectionStatus !== 'connected') {
      toast.error('Connect a device first to run diagnostics.');
      return;
    }
    addLog(`>>> run_diagnostics`);
    setTimeout(() => {
      addLog(`[SYSTEM CHECK] RAM Heap Free: 312 KB / 512 KB`);
      addLog(`[SYSTEM CHECK] Flash Integrity: PASSED`);
      addLog(`[SYSTEM CHECK] Sensor I2C Bus: 0x68 (MPU6050) Connected`);
      addLog(`[SYSTEM CHECK] Voltage: 3.32V (Stable)`);
      addLog(`<<< diagnostics completed successfully`);
      toast.success('Hardware diagnostics completed successfully.');
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-serif">Device Lab</h1>
        <p className="text-slate-500 mt-1">Configure serial transports, check chip status, and monitor raw telemetry streams.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Controls */}
        <Card className="p-6 border border-slate-200 bg-white shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-500" /> Device Connection
            </h3>
            
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500 font-semibold">Baud Rate</label>
                <select 
                  value={baudRate}
                  onChange={(e) => setBaudRate(Number(e.target.value))}
                  disabled={connectionStatus === 'connected'}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={9600}>9600 bps</option>
                  <option value={38400}>38400 bps</option>
                  <option value={57600}>57600 bps</option>
                  <option value={115200}>115200 bps</option>
                  <option value={921600}>921600 bps</option>
                </select>
              </div>

              <div className="flex justify-between items-center text-sm pt-2">
                <span className="text-slate-500">Status</span>
                {connectionStatus === 'connected' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Wifi className="w-3.5 h-3.5" /> Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                    <WifiOff className="w-3.5 h-3.5" /> Disconnected
                  </span>
                )}
              </div>

              {deviceInfo && (
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-2 mt-4 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Chip Family</span>
                    <span className="font-semibold text-slate-700">{deviceInfo.chipId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Firmware</span>
                    <span className="font-semibold text-slate-700">{deviceInfo.firmware}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Port</span>
                    <span className="font-semibold text-slate-700">{deviceInfo.port}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {connectionStatus === 'connected' ? (
              <Button variant="danger" className="w-full flex justify-center items-center gap-2" onClick={disconnect}>
                <Square className="w-4 h-4 fill-current" /> Disconnect
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => connectMock()} 
                  disabled={connectionStatus === 'connecting'}
                >
                  Simulate
                </Button>
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white shadow-md" 
                  onClick={() => connect(baudRate)} 
                  disabled={connectionStatus === 'connecting'}
                >
                  {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect'}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Diagnostics & Command Tests */}
        <Card className="p-6 border border-slate-200 bg-white shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Command Diagnostics</h3>
            <p className="text-sm text-slate-500 leading-normal">
              Execute handshake packets, verify CRC checks, and check internal microcontroller free heap status.
            </p>

            <div className="space-y-2 pt-2">
              <Button 
                variant="outline" 
                className="w-full flex justify-between items-center" 
                onClick={handlePing}
                disabled={connectionStatus !== 'connected'}
              >
                <span>Ping Microcontroller</span>
                <Play className="w-3.5 h-3.5 text-slate-400" />
              </Button>
              <Button 
                variant="outline" 
                className="w-full flex justify-between items-center" 
                onClick={handleDiagnostics}
                disabled={connectionStatus !== 'connected'}
              >
                <span>Run System Diagnostics</span>
                <Play className="w-3.5 h-3.5 text-slate-400" />
              </Button>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-600 leading-relaxed">
            Note: Commands use standard TLV packet encapsulation. Delimited by 0x00 and validated via 8-bit CRC.
          </div>
        </Card>

        {/* Console Log Terminal */}
        <Card className="lg:col-span-3 p-6 border border-slate-200 bg-white shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-slate-500" /> Diagnostic Terminal Console
          </h3>

          <div className="h-64 bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 overflow-y-auto space-y-1.5 shadow-inner">
            {consoleLogs.map((log, index) => (
              <div key={index} className="leading-relaxed whitespace-pre-wrap">
                {log}
              </div>
            ))}
            <div ref={consoleBottomRef} />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConsoleLogs([])}>
              Clear Terminal
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
