import { RingBuffer } from './buffer.js';

export interface SerialTransportOptions {
  baudRate: number;
  bufferSize?: number;
}

export interface SerialTransportEvents {
  onData?: (data: Uint8Array) => void;
  onPacket?: (packet: Uint8Array) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export class SerialTransport {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private keepReading: boolean = false;
  private buffer: RingBuffer;
  
  constructor(
    private options: SerialTransportOptions,
    private events: SerialTransportEvents
  ) {
    this.buffer = new RingBuffer(options.bufferSize || 1024 * 64); // 64KB default
  }

  async requestPort(): Promise<void> {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API is not supported in this browser.');
    }
    this.port = await navigator.serial.requestPort();
  }

  async open(): Promise<void> {
    if (!this.port) {
      throw new Error('No port selected. Call requestPort() first.');
    }

    await this.port.open({ baudRate: this.options.baudRate });
    
    // Set up writer
    if (this.port.writable) {
      this.writer = this.port.writable.getWriter();
    }

    this.keepReading = true;
    this.readLoop();
    
    if (this.events.onConnect) {
      this.events.onConnect();
    }
  }

  async close(): Promise<void> {
    this.keepReading = false;
    
    if (this.reader) {
      await this.reader.cancel();
      this.reader = null;
    }
    
    if (this.writer) {
      await this.writer.close();
      this.writer = null;
    }
    
    if (this.port) {
      await this.port.close();
      this.port = null;
    }
    
    if (this.events.onDisconnect) {
      this.events.onDisconnect();
    }
  }

  async write(data: Uint8Array): Promise<void> {
    if (!this.writer) {
      throw new Error('Serial port is not open or not writable.');
    }
    await this.writer.write(data);
  }

  private async readLoop(): Promise<void> {
    if (!this.port || !this.port.readable) return;

    try {
      this.reader = this.port.readable.getReader();
      
      while (this.keepReading) {
        const { value, done } = await this.reader.read();
        
        if (done) {
          break;
        }
        
        if (value) {
          if (this.events.onData) {
            this.events.onData(value);
          }
          
          this.buffer.push(value);
          this.processBuffer();
        }
      }
    } catch (error) {
      if (this.events.onError) {
        this.events.onError(error instanceof Error ? error : new Error(String(error)));
      }
    } finally {
      if (this.reader) {
        this.reader.releaseLock();
        this.reader = null;
      }
    }
  }

  private processBuffer(): void {
    if (!this.events.onPacket) return;
    
    // Process all available packets (delimited by 0x00)
    let packet = this.buffer.popUntil(0x00);
    while (packet !== null) {
      this.events.onPacket(packet);
      packet = this.buffer.popUntil(0x00);
    }
  }
}
