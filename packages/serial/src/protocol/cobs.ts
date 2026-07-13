/**
 * COBS (Consistent Overhead Byte Stuffing) encoder/decoder.
 *
 * COBS eliminates all 0x00 bytes from the payload, allowing 0x00
 * to serve as an unambiguous frame delimiter. This provides constant
 * overhead of at most 1 byte per 254 bytes of input.
 *
 * Frame format: [COBS-encoded payload] [0x00 delimiter]
 *
 * Reference: Cheshire & Baker, "Consistent Overhead Byte Stuffing", 1997
 */

/** Maximum run length before a COBS overhead byte is inserted. */
const COBS_MAX_RUN = 0xfe;

/**
 * COBS-encode a byte buffer.
 *
 * @param data - Raw bytes to encode. May contain 0x00 values.
 * @returns Encoded bytes with all 0x00 values removed.
 *          The caller must append a 0x00 frame delimiter after this output.
 *
 * @example
 * ```ts
 * const encoded = cobsEncode(new Uint8Array([0x01, 0x00, 0x03]));
 * // Result: [0x02, 0x01, 0x02, 0x03]
 * ```
 */
export function cobsEncode(data: Uint8Array): Uint8Array {
  if (data.length === 0) {
    return new Uint8Array([0x01]);
  }

  // Worst case: input_length + ceil(input_length / 254) + 1
  const maxOutputLen = data.length + Math.ceil(data.length / 254) + 1;
  const output = new Uint8Array(maxOutputLen);

  let readIdx = 0;
  let writeIdx = 1; // Reserve first byte for overhead code
  let codeIdx = 0; // Position of current overhead code byte
  let runLength = 1; // Distance to next zero (or end)

  while (readIdx < data.length) {
    const byte = data[readIdx];

    if (byte === 0x00) {
      // Write run length at the code position
      output[codeIdx] = runLength;
      codeIdx = writeIdx;
      writeIdx++;
      runLength = 1;
    } else {
      output[writeIdx] = byte!;
      writeIdx++;
      runLength++;

      if (runLength === 0xff) {
        // Max run reached, insert overhead byte
        output[codeIdx] = runLength;
        codeIdx = writeIdx;
        writeIdx++;
        runLength = 1;
      }
    }

    readIdx++;
  }

  // Write final run length
  output[codeIdx] = runLength;

  return output.slice(0, writeIdx);
}

/**
 * COBS-decode a byte buffer.
 *
 * @param data - COBS-encoded bytes (without the trailing 0x00 delimiter).
 * @returns Decoded bytes with original 0x00 values restored.
 * @throws Error if the encoded data is malformed.
 *
 * @example
 * ```ts
 * const decoded = cobsDecode(new Uint8Array([0x02, 0x01, 0x02, 0x03]));
 * // Result: [0x01, 0x00, 0x03]
 * ```
 */
export function cobsDecode(data: Uint8Array): Uint8Array {
  if (data.length === 0) {
    return new Uint8Array(0);
  }

  const output = new Uint8Array(data.length); // Decoded is always <= encoded length
  let readIdx = 0;
  let writeIdx = 0;

  while (readIdx < data.length) {
    const code = data[readIdx];
    if (code === undefined) break;

    if (code === 0x00) {
      throw new Error(`COBS decode error: unexpected zero byte at index ${readIdx}`);
    }

    readIdx++;

    // Copy (code - 1) data bytes
    const dataBytesCount = code - 1;
    for (let i = 0; i < dataBytesCount; i++) {
      if (readIdx >= data.length) {
        throw new Error(`COBS decode error: truncated data at index ${readIdx}`);
      }
      const byte = data[readIdx];
      if (byte === undefined) {
        throw new Error(`COBS decode error: undefined byte at index ${readIdx}`);
      }
      output[writeIdx] = byte;
      writeIdx++;
      readIdx++;
    }

    // If code < 0xFF and we're not at the end, insert a zero
    if (code < 0xff && readIdx < data.length) {
      output[writeIdx] = 0x00;
      writeIdx++;
    }
  }

  return output.slice(0, writeIdx);
}
