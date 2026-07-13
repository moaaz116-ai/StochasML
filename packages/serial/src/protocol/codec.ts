/**
 * Packet codec: assembles and disassembles complete serial packets.
 *
 * Packet format:
 *   [0x00 delimiter] [COBS-encoded(TLV payload + CRC8)] [0x00 delimiter]
 *
 * The CRC-8 is computed over the raw TLV payload (before COBS encoding).
 * The delimiter bytes are not included in the COBS-encoded portion.
 */

import { cobsEncode, cobsDecode } from './cobs.js';
import { crc8 } from './crc8.js';
import { tlvEncode, tlvDecode, type TlvMessage } from './tlv.js';
import type { MessageType } from './types.js';

/** A decoded packet with type, version, and payload. */
export interface Packet {
  readonly type: MessageType;
  readonly version: number;
  readonly payload: Uint8Array;
}

/**
 * Encode a message into a complete serial packet.
 *
 * Steps:
 * 1. TLV-encode the message (type + length + version + value)
 * 2. Compute CRC-8 over the TLV bytes
 * 3. Append CRC-8 to the TLV bytes
 * 4. COBS-encode the result
 * 5. Wrap with 0x00 delimiters
 *
 * @param type - Message type.
 * @param value - Message payload.
 * @param version - Protocol version.
 * @returns Complete packet bytes ready for serial transmission.
 */
export function encodePacket(
  type: MessageType,
  value: Uint8Array = new Uint8Array(0),
  version?: number,
): Uint8Array {
  // Step 1: TLV encode
  const tlvBytes = tlvEncode(type, value, version);

  // Step 2: Compute CRC over TLV
  const checksum = crc8(tlvBytes);

  // Step 3: Append CRC
  const withCrc = new Uint8Array(tlvBytes.length + 1);
  withCrc.set(tlvBytes);
  withCrc[tlvBytes.length] = checksum;

  // Step 4: COBS encode
  const cobsEncoded = cobsEncode(withCrc);

  // Step 5: Wrap with delimiters
  const packet = new Uint8Array(cobsEncoded.length + 2);
  packet[0] = 0x00;
  packet.set(cobsEncoded, 1);
  packet[cobsEncoded.length + 1] = 0x00;

  return packet;
}

/**
 * Decode a complete serial packet.
 *
 * @param data - Raw packet bytes (including 0x00 delimiters).
 * @returns Decoded packet, or null if CRC check fails.
 * @throws Error if data is malformed.
 */
export function decodePacket(data: Uint8Array): Packet | null {
  // Strip leading/trailing 0x00 delimiters
  let start = 0;
  let end = data.length;

  while (start < end && data[start] === 0x00) start++;
  while (end > start && data[end - 1] === 0x00) end--;

  if (start >= end) {
    throw new Error('Packet contains no data between delimiters');
  }

  const cobsData = data.slice(start, end);

  // Step 1: COBS decode
  const decoded = cobsDecode(cobsData);

  if (decoded.length < 2) {
    throw new Error(`Packet too short after COBS decode: ${decoded.length} bytes`);
  }

  // Step 2: Extract CRC (last byte)
  const receivedCrc = decoded[decoded.length - 1]!;
  const tlvBytes = decoded.slice(0, decoded.length - 1);

  // Step 3: Verify CRC
  const computedCrc = crc8(tlvBytes);
  if (computedCrc !== receivedCrc) {
    return null; // CRC mismatch — packet is corrupted
  }

  // Step 4: TLV decode
  const tlvMessage: TlvMessage = tlvDecode(tlvBytes);

  return {
    type: tlvMessage.type,
    version: tlvMessage.version,
    payload: tlvMessage.value,
  };
}
