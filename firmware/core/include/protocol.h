#ifndef INFERA_PROTOCOL_H
#define INFERA_PROTOCOL_H

#include <stdint.h>

#define PROTOCOL_VERSION 1

typedef enum {
    MSG_HANDSHAKE_REQ = 0x01,
    MSG_HANDSHAKE_RES = 0x02,
    MSG_CONFIG_SET = 0x03,
    MSG_CONFIG_ACK = 0x04,
    MSG_START_SAMPLING = 0x10,
    MSG_STOP_SAMPLING = 0x11,
    MSG_DATA_FRAME = 0x20,
    MSG_DATA_ACK = 0x21,
    MSG_STATUS = 0x30,
    MSG_ERROR = 0xFF
} message_type_t;

typedef struct {
    message_type_t type;
    uint8_t version;
    uint16_t length;
    uint8_t* payload;
} tlv_message_t;

// Forward declarations
size_t cobs_encode(const uint8_t *src, size_t length, uint8_t *dst);
size_t cobs_decode(const uint8_t *src, size_t length, uint8_t *dst);
uint8_t crc8(const uint8_t *data, size_t length);

#endif // INFERA_PROTOCOL_H
