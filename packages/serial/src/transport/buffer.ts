export class RingBuffer {
  private buffer: Uint8Array;
  private head: number = 0;
  private tail: number = 0;
  private length: number = 0;

  constructor(capacity: number) {
    this.buffer = new Uint8Array(capacity);
  }

  push(data: Uint8Array): void {
    for (let i = 0; i < data.length; i++) {
      if (this.length >= this.buffer.length) {
        // Overwrite oldest data
        this.tail = (this.tail + 1) % this.buffer.length;
        this.length--;
      }
      
      const byte = data[i];
      if (byte === undefined) continue;

      this.buffer[this.head] = byte;
      this.head = (this.head + 1) % this.buffer.length;
      this.length++;
    }
  }

  popUntil(delimiter: number): Uint8Array | null {
    if (this.length === 0) return null;

    let index = this.tail;
    let found = false;
    let scanCount = 0;

    // Search for delimiter
    while (scanCount < this.length) {
      if (this.buffer[index] === delimiter) {
        found = true;
        break;
      }
      index = (index + 1) % this.buffer.length;
      scanCount++;
    }

    if (!found) return null;

    // Extract the frame
    const frameLength = scanCount + 1; // +1 to include delimiter
    const frame = new Uint8Array(frameLength);

    for (let i = 0; i < frameLength; i++) {
      frame[i] = this.buffer[this.tail]!;
      this.tail = (this.tail + 1) % this.buffer.length;
    }

    this.length -= frameLength;
    return frame;
  }

  clear(): void {
    this.head = 0;
    this.tail = 0;
    this.length = 0;
  }
}
