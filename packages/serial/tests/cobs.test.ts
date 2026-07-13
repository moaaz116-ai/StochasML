import { describe, it, expect } from 'vitest';
import { cobsEncode, cobsDecode } from '../src/protocol/cobs.js';

describe('COBS Framing', () => {
  it('should encode and decode empty array', () => {
    const data = new Uint8Array(0);
    const encoded = cobsEncode(data);
    const decoded = cobsDecode(encoded);
    
    expect(decoded).toEqual(data);
  });

  it('should encode and decode data without zeros', () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const encoded = cobsEncode(data);
    const decoded = cobsDecode(encoded);
    
    expect(decoded).toEqual(data);
  });

  it('should encode and decode data with zeros', () => {
    const data = new Uint8Array([1, 0, 2, 0, 3]);
    const encoded = cobsEncode(data);
    const decoded = cobsDecode(encoded);
    
    expect(decoded).toEqual(data);
  });

  it('should handle large sequences correctly', () => {
    const data = new Uint8Array(300);
    for (let i = 0; i < 300; i++) {
      data[i] = i % 255 + 1; // No zeros
    }
    
    const encoded = cobsEncode(data);
    const decoded = cobsDecode(encoded);
    
    expect(decoded).toEqual(data);
  });
});
