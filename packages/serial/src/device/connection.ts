import { SerialTransport } from '../transport/web-serial.js';
import { encodePacket, decodePacket, type Packet } from '../protocol/codec.js';
import { MessageType, type HandshakeResponse, type StatusMessage } from '../protocol/types.js';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface DeviceConnectionEvents {
  onStateChange?: (state: ConnectionState) => void;
  onHandshake?: (response: HandshakeResponse) => void;
  onStatus?: (status: StatusMessage) => void;
  onData?: (data: Float32Array, timestamp: number) => void;
  onError?: (error: Error) => void;
}

export class DeviceConnection {
  private transport: SerialTransport | null = null;
  private state: ConnectionState = 'disconnected';
  private handshakeResolve: ((res: HandshakeResponse) => void) | null = null;

  constructor(private events: DeviceConnectionEvents = {}) {}

  private setState(newState: ConnectionState) {
    if (this.state !== newState) {
      this.state = newState;
      if (this.events.onStateChange) {
        this.events.onStateChange(newState);
      }
    }
  }

  async connect(baudRate: number = 115200): Promise<HandshakeResponse> {
    try {
      this.setState('connecting');
      
      this.transport = new SerialTransport(
        { baudRate },
        {
          onPacket: this.handlePacket.bind(this),
          onDisconnect: () => this.setState('disconnected'),
          onError: (err) => {
            if (this.events.onError) this.events.onError(err);
            this.setState('error');
          }
        }
      );

      await this.transport.requestPort();
      await this.transport.open();
      
      // Perform handshake
      return new Promise<HandshakeResponse>((resolve, reject) => {
        this.handshakeResolve = resolve;
        
        // Timeout after 3 seconds
        setTimeout(() => {
          if (this.handshakeResolve) {
            this.handshakeResolve = null;
            this.disconnect();
            reject(new Error('Handshake timeout'));
          }
        }, 3000);
        
        // Send handshake request
        const req = encodePacket(MessageType.HANDSHAKE_REQ);
        this.transport?.write(req).catch(reject);
      });
      
    } catch (error) {
      this.setState('error');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
    this.setState('disconnected');
  }

  async startSampling(): Promise<void> {
    if (this.state !== 'connected' || !this.transport) {
      throw new Error('Not connected');
    }
    const packet = encodePacket(MessageType.START_SAMPLING);
    await this.transport.write(packet);
  }

  async stopSampling(): Promise<void> {
    if (this.state !== 'connected' || !this.transport) {
      throw new Error('Not connected');
    }
    const packet = encodePacket(MessageType.STOP_SAMPLING);
    await this.transport.write(packet);
  }

  private handlePacket(rawPacket: Uint8Array): void {
    try {
      const packet = decodePacket(rawPacket);
      if (!packet) return; // CRC failed
      
      switch (packet.type) {
        case MessageType.HANDSHAKE_RES: {
          const jsonStr = new TextDecoder().decode(packet.payload);
          const response = JSON.parse(jsonStr) as HandshakeResponse;
          
          if (this.handshakeResolve) {
            this.setState('connected');
            this.handshakeResolve(response);
            this.handshakeResolve = null;
          }
          if (this.events.onHandshake) {
            this.events.onHandshake(response);
          }
          break;
        }
          
        case MessageType.STATUS: {
          const jsonStr = new TextDecoder().decode(packet.payload);
          const status = JSON.parse(jsonStr) as StatusMessage;
          if (this.events.onStatus) {
            this.events.onStatus(status);
          }
          break;
        }
          
        case MessageType.DATA_FRAME: {
          // Format: [timestamp: uint32 LE] [samples: float32[] LE]
          const view = new DataView(packet.payload.buffer, packet.payload.byteOffset, packet.payload.byteLength);
          const timestamp = view.getUint32(0, true);
          
          const samplesArray = new Float32Array((packet.payload.byteLength - 4) / 4);
          for (let i = 0; i < samplesArray.length; i++) {
            samplesArray[i] = view.getFloat32(4 + (i * 4), true);
          }
          
          if (this.events.onData) {
            this.events.onData(samplesArray, timestamp);
          }
          break;
        }
          
        case MessageType.ERROR: {
          // Format: [code: uint8] [message: utf8]
          const code = packet.payload[0];
          const message = new TextDecoder().decode(packet.payload.slice(1));
          if (this.events.onError) {
            this.events.onError(new Error(`Device Error ${code}: ${message}`));
          }
          break;
        }
      }
    } catch (err) {
      console.warn('Failed to parse packet:', err);
    }
  }
}
