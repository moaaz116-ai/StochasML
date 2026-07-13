/**
 * Protocol message types and data structures for Infera serial communication.
 *
 * These types define the application-level messages exchanged between
 * the host (browser) and the device (ESP32-S3) over the serial protocol.
 */

/** Current protocol version. Incremented on breaking changes. */
export const ProtocolVersion = 1 as const;

/**
 * Message type identifiers for TLV encoding.
 * Each message has a unique 1-byte type code and a defined direction.
 */
export enum MessageType {
  // Handshake (0x01-0x0F)
  HANDSHAKE_REQ = 0x01,
  HANDSHAKE_RES = 0x02,

  // Configuration (0x03-0x0F)
  CONFIG_SET = 0x03,
  CONFIG_ACK = 0x04,

  // Sampling control (0x10-0x1F)
  START_SAMPLING = 0x10,
  STOP_SAMPLING = 0x11,

  // Data transfer (0x20-0x2F)
  DATA_FRAME = 0x20,
  DATA_ACK = 0x21,

  // Status (0x30-0x3F)
  STATUS = 0x30,

  // Error (0xFF)
  ERROR = 0xff,
}

/** Device identification returned during handshake. */
export interface DeviceInfo {
  readonly boardType: string;
  readonly firmwareVersion: string;
  readonly protocolVersion: number;
  readonly capabilities: readonly string[];
  readonly sensorChannels: readonly string[];
}

/** Sampling configuration sent to the device. */
export interface SamplingConfig {
  readonly rateHz: number;
  readonly channels: readonly string[];
  readonly durationMs: number;
}

/** A single frame of sensor data from the device. */
export interface DataFrame {
  readonly sequenceNumber: number;
  readonly timestamp: number;
  readonly channels: number;
  readonly samples: Float32Array;
}

/** Device status update. */
export interface StatusMessage {
  readonly state: 'idle' | 'sampling' | 'error' | 'ready';
  readonly message: string;
  readonly uptimeMs: number;
}

/** Error message from either direction. */
export interface ErrorMessage {
  readonly code: number;
  readonly message: string;
}

/** Handshake response from device. */
export interface HandshakeResponse {
  readonly deviceInfo: DeviceInfo;
}

/** Error codes for the protocol. */
export enum ErrorCode {
  UNKNOWN = 0x00,
  CRC_MISMATCH = 0x01,
  INVALID_MESSAGE = 0x02,
  UNSUPPORTED_VERSION = 0x03,
  SENSOR_ERROR = 0x04,
  BUFFER_OVERFLOW = 0x05,
  INVALID_CONFIG = 0x06,
  BUSY = 0x07,
}
