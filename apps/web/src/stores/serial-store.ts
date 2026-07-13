import { create } from 'zustand';
import { DeviceConnection } from '@infera/serial';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface SerialDeviceInfo {
  port: string;
  baudRate: number;
  chipId: string;
  firmware: string;
}

interface SerialState {
  connectionStatus: ConnectionStatus;
  port: any | null;
  mockInterval: any | null;
  deviceInfo: SerialDeviceInfo | null;
  dataBuffer: Float32Array;
  droppedFramesCount: number;
  isRecording: boolean;
  deviceConnection: DeviceConnection | null;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setDataBuffer: (buffer: Float32Array) => void;
  setIsRecording: (val: boolean) => void;
  clearBuffer: () => void;
  connect: (baudRate?: number, expectedChannels?: number) => Promise<void>;
  connectMock: (expectedChannels?: number) => void;
  disconnect: () => Promise<void>;
}

export const useSerialStore = create<SerialState>((set, get) => ({
  connectionStatus: 'disconnected',
  port: null,
  mockInterval: null,
  deviceInfo: null,
  dataBuffer: new Float32Array(0),
  droppedFramesCount: 0,
  isRecording: false,
  deviceConnection: null,
  
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setDataBuffer: (buffer) => set({ dataBuffer: buffer }),
  setIsRecording: (val) => set({ isRecording: val }),
  clearBuffer: () => set({ dataBuffer: new Float32Array(0), droppedFramesCount: 0 }),
  
  connect: async (baudRate = 115200, expectedChannels = 3) => {
    try {
      set({ connectionStatus: 'connecting', droppedFramesCount: 0 });
      
      const conn = new DeviceConnection({
        onStateChange: (state) => set({ connectionStatus: state as ConnectionStatus }),
        onData: (samples) => {
          // Verify expected channel count
          if (samples.length !== expectedChannels) {
            set((state) => ({ droppedFramesCount: state.droppedFramesCount + 1 }));
            return;
          }
          
          if (!get().isRecording) return;
          
          const currentBuffer = get().dataBuffer;
          const nextBuffer = new Float32Array(currentBuffer.length + samples.length);
          nextBuffer.set(currentBuffer);
          nextBuffer.set(samples, currentBuffer.length);
          
          const maxValues = 10000; // larger recording buffer
          if (nextBuffer.length > maxValues) {
            set({ dataBuffer: nextBuffer.slice(nextBuffer.length - maxValues) });
          } else {
            set({ dataBuffer: nextBuffer });
          }
        },
        onError: (err) => {
          console.error('Serial connection error:', err);
          set((state) => ({ droppedFramesCount: state.droppedFramesCount + 1 }));
        }
      });

      const response = await conn.connect(baudRate);
      
      set({
        deviceConnection: conn,
        connectionStatus: 'connected',
        deviceInfo: {
          port: 'Web Serial Device',
          baudRate,
          chipId: response.deviceInfo.boardType || 'ESP32-S3',
          firmware: response.deviceInfo.firmwareVersion || 'Infera OS v1.0',
        },
      });

      // Start device sampling automatically
      await conn.startSampling();
    } catch (error) {
      console.error('Failed to connect to serial port', error);
      set({ connectionStatus: 'error' });
      throw error;
    }
  },

  connectMock: (expectedChannels = 3) => {
    set({ connectionStatus: 'connecting', droppedFramesCount: 0 });
    
    // Stop any existing mock interval
    const existing = get().mockInterval;
    if (existing) clearInterval(existing);

    setTimeout(() => {
      const intervalId = setInterval(() => {
        const currentStatus = get().connectionStatus;
        if (currentStatus !== 'connected') {
          clearInterval(intervalId);
          return;
        }

        // Generate matching expected channel counts
        const newSamples: number[] = [];
        const t = Date.now() / 1000;
        
        for (let ch = 0; ch < expectedChannels; ch++) {
          // Generate sine wave configurations with phase shifts
          const val = Math.sin(t * (2.0 + ch * 0.5)) * (1.5 - ch * 0.2) + (Math.random() - 0.5) * 0.1;
          newSamples.push(val);
        }

        // Randomly simulate 1% packet loss/dropped frames
        if (Math.random() < 0.01) {
          set((state) => ({ droppedFramesCount: state.droppedFramesCount + 1 }));
          return;
        }

        if (!get().isRecording) return;

        const currentBuffer = get().dataBuffer;
        const nextBuffer = new Float32Array(currentBuffer.length + newSamples.length);
        nextBuffer.set(currentBuffer);
        nextBuffer.set(newSamples, currentBuffer.length);
        
        const maxValues = 10000;
        if (nextBuffer.length > maxValues) {
          set({ dataBuffer: nextBuffer.slice(nextBuffer.length - maxValues) });
        } else {
          set({ dataBuffer: nextBuffer });
        }
      }, 50); // 20 Hz sample rate

      set({
        connectionStatus: 'connected',
        mockInterval: intervalId,
        deviceInfo: {
          port: 'Simulator Connection',
          baudRate: 115200,
          chipId: 'ESP32-S3 (Simulator)',
          firmware: 'Infera Simulator OS v1.0',
        },
      });
    }, 400);
  },

  disconnect: async () => {
    const { deviceConnection, mockInterval } = get();
    if (mockInterval) {
      clearInterval(mockInterval);
    }
    if (deviceConnection) {
      try {
        await deviceConnection.stopSampling();
        await deviceConnection.disconnect();
      } catch (e) {
        console.error(e);
      }
    }
    set({
      port: null,
      deviceConnection: null,
      mockInterval: null,
      connectionStatus: 'disconnected',
      deviceInfo: null,
      isRecording: false,
    });
  },
}));
