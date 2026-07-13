/**
 * @module @infera/serial
 *
 * Binary serial protocol for Infera TinyML platform.
 * Uses COBS framing, CRC-8 checksums, and TLV message encoding
 * for reliable communication with ESP32-S3 and compatible boards.
 */

export { crc8, CRC8_POLYNOMIAL } from './protocol/crc8.js';
export { cobsEncode, cobsDecode } from './protocol/cobs.js';
export {
  tlvEncode,
  tlvDecode,
  type TlvMessage,
} from './protocol/tlv.js';
export {
  encodePacket,
  decodePacket,
  type Packet,
} from './protocol/codec.js';
export {
  MessageType,
  ProtocolVersion,
  type DeviceInfo,
  type SamplingConfig,
  type DataFrame,
  type StatusMessage,
  type ErrorMessage,
  type HandshakeResponse,
} from './protocol/types.js';
export {
  type SerialTransportOptions,
  type SerialTransportEvents,
  SerialTransport,
} from './transport/web-serial.js';
export { RingBuffer } from './transport/buffer.js';
export {
  DeviceConnection,
  type ConnectionState,
  type DeviceConnectionEvents,
} from './device/connection.js';
