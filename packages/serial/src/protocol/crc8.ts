/**
 * CRC-8 checksum implementation (CCITT polynomial 0x07).
 *
 * Used to verify packet integrity in the Infera serial protocol.
 * Both the TypeScript (browser) and C (firmware) implementations
 * must produce identical results for the same input.
 */

/** CRC-8 CCITT polynomial. */
export const CRC8_POLYNOMIAL = 0x07;

/** Initial CRC value. */
const CRC8_INIT = 0x00;

/**
 * Pre-computed CRC-8 lookup table for polynomial 0x07.
 * Generated once at module load for O(1) per-byte computation.
 */
const CRC8_TABLE: Uint8Array = buildTable();

function buildTable(): Uint8Array {
  const table = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x80 ? ((crc << 1) ^ CRC8_POLYNOMIAL) & 0xff : (crc << 1) & 0xff;
    }
    table[i] = crc;
  }
  return table;
}

/**
 * Compute CRC-8 checksum over the given data.
 *
 * @param data - Input bytes to checksum.
 * @returns Single-byte CRC-8 value.
 *
 * @example
 * ```ts
 * const checksum = crc8(new Uint8Array([0x01, 0x02, 0x03]));
 * ```
 */
export function crc8(data: Uint8Array): number {
  let crc = CRC8_INIT;
  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    if (byte === undefined) continue;
    const tableIndex = (crc ^ byte) & 0xff;
    const tableValue = CRC8_TABLE[tableIndex];
    if (tableValue === undefined) continue;
    crc = tableValue;
  }
  return crc;
}

/**
 * Verify that data matches an expected CRC-8 checksum.
 *
 * @param data - Input bytes.
 * @param expected - Expected CRC-8 value.
 * @returns True if the computed CRC matches expected.
 */
export function verifyCrc8(data: Uint8Array, expected: number): boolean {
  return crc8(data) === expected;
}
