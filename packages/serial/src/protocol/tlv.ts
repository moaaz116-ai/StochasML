/**
 * TLV (Type-Length-Value) message encoder/decoder for the Infera protocol.
 *
 * Each TLV message has the format:
 *   [Type: 1 byte] [Length: 2 bytes LE] [Version: 1 byte] [Value: Length bytes]
 *
 * The Type field corresponds to a MessageType enum value.
 * The Length field is the byte length of the Value portion only.
 * The Version field is the protocol version for forward compatibility.
 */

import { type MessageType, ProtocolVersion } from './types.js';

/** Header size: type (1) + length (2) + version (1) = 4 bytes. */
const TLV_HEADER_SIZE = 4;

/** Maximum value payload size (64 KB). */
const TLV_MAX_VALUE_SIZE = 65535;

/** A parsed TLV message. */
export interface TlvMessage {
  readonly type: MessageType;
  readonly version: number;
  readonly value: Uint8Array;
}

/**
 * Encode a TLV message into bytes.
 *
 * @param type - Message type identifier.
 * @param value - Message payload bytes.
 * @param version - Protocol version (defaults to current).
 * @returns Encoded TLV bytes: [type][lengthLo][lengthHi][version][...value].
 * @throws Error if value exceeds maximum size.
 */
export function tlvEncode(
  type: MessageType,
  value: Uint8Array = new Uint8Array(0),
  version: number = ProtocolVersion,
): Uint8Array {
  if (value.length > TLV_MAX_VALUE_SIZE) {
    throw new Error(
      `TLV value size ${value.length} exceeds maximum ${TLV_MAX_VALUE_SIZE}`,
    );
  }

  const output = new Uint8Array(TLV_HEADER_SIZE + value.length);
  output[0] = type & 0xff;
  output[1] = value.length & 0xff; // Length low byte
  output[2] = (value.length >> 8) & 0xff; // Length high byte
  output[3] = version & 0xff;

  output.set(value, TLV_HEADER_SIZE);

  return output;
}

/**
 * Decode a TLV message from bytes.
 *
 * @param data - Raw bytes containing a TLV message.
 * @returns Parsed TLV message.
 * @throws Error if data is too short or length field is inconsistent.
 */
export function tlvDecode(data: Uint8Array): TlvMessage {
  if (data.length < TLV_HEADER_SIZE) {
    throw new Error(
      `TLV data too short: ${data.length} bytes, need at least ${TLV_HEADER_SIZE}`,
    );
  }

  const type = data[0] as unknown as MessageType;
  const lengthLo = data[1]!;
  const lengthHi = data[2]!;
  const length = lengthLo | (lengthHi << 8);
  const version = data[3]!;

  if (data.length < TLV_HEADER_SIZE + length) {
    throw new Error(
      `TLV value truncated: expected ${length} bytes, got ${data.length - TLV_HEADER_SIZE}`,
    );
  }

  const value = data.slice(TLV_HEADER_SIZE, TLV_HEADER_SIZE + length);

  return { type, version, value };
}

/**
 * Try to decode multiple TLV messages from a contiguous byte buffer.
 *
 * @param data - Buffer potentially containing multiple TLV messages.
 * @returns Array of parsed messages and the number of bytes consumed.
 */
export function tlvDecodeMultiple(data: Uint8Array): {
  messages: TlvMessage[];
  bytesConsumed: number;
} {
  const messages: TlvMessage[] = [];
  let offset = 0;

  while (offset + TLV_HEADER_SIZE <= data.length) {
    const lengthLo = data[offset + 1];
    const lengthHi = data[offset + 2];
    if (lengthLo === undefined || lengthHi === undefined) break;

    const valueLength = lengthLo | (lengthHi << 8);
    const totalLength = TLV_HEADER_SIZE + valueLength;

    if (offset + totalLength > data.length) {
      break; // Incomplete message
    }

    const messageBytes = data.slice(offset, offset + totalLength);
    messages.push(tlvDecode(messageBytes));
    offset += totalLength;
  }

  return { messages, bytesConsumed: offset };
}
