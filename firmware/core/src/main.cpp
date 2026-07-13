#include <Arduino.h>
#include "protocol.h"
#include <ArduinoJson.h>

#define LED_PIN 48 // Default RGB LED pin on ESP32-S3 DevKitC
#define SERIAL_BAUD 115200

// Buffer for incoming serial data
uint8_t rx_buffer[1024];
size_t rx_index = 0;

// Buffer for decoded/encoded packets
uint8_t packet_buffer[1024];

bool is_sampling = false;
unsigned long last_sample_time = 0;
uint32_t sample_sequence = 0;
int sample_rate_hz = 100;
int sample_interval_ms = 10;

void send_handshake_response() {
    StaticJsonDocument<256> doc;
    JsonObject deviceInfo = doc.createNestedObject("deviceInfo");
    deviceInfo["boardType"] = "ESP32-S3";
    deviceInfo["firmwareVersion"] = "1.0.0";
    deviceInfo["protocolVersion"] = PROTOCOL_VERSION;
    
    JsonArray capabilities = deviceInfo.createNestedArray("capabilities");
    capabilities.add("imu");
    capabilities.add("temp");
    
    JsonArray channels = deviceInfo.createNestedArray("sensorChannels");
    channels.add("accel_x");
    channels.add("accel_y");
    channels.add("accel_z");
    
    char json_buffer[256];
    size_t json_len = serializeJson(doc, json_buffer);
    
    // Construct TLV
    packet_buffer[0] = MSG_HANDSHAKE_RES;
    packet_buffer[1] = json_len & 0xFF;
    packet_buffer[2] = (json_len >> 8) & 0xFF;
    packet_buffer[3] = PROTOCOL_VERSION;
    memcpy(&packet_buffer[4], json_buffer, json_len);
    
    size_t tlv_len = 4 + json_len;
    
    // CRC
    uint8_t checksum = crc8(packet_buffer, tlv_len);
    packet_buffer[tlv_len] = checksum;
    
    // COBS
    uint8_t cobs_buffer[512];
    size_t cobs_len = cobs_encode(packet_buffer, tlv_len + 1, cobs_buffer);
    
    // Send with delimiters
    Serial.write(0x00);
    Serial.write(cobs_buffer, cobs_len);
    Serial.write(0x00);
}

void process_packet(uint8_t* data, size_t length) {
    if (length < 2) return;
    
    // COBS Decode
    size_t decoded_len = cobs_decode(data, length, packet_buffer);
    if (decoded_len < 5) return; // Need at least TLV header + CRC
    
    size_t tlv_len = decoded_len - 1;
    uint8_t received_crc = packet_buffer[tlv_len];
    uint8_t computed_crc = crc8(packet_buffer, tlv_len);
    
    if (received_crc != computed_crc) return; // CRC mismatch
    
    message_type_t type = (message_type_t)packet_buffer[0];
    
    switch (type) {
        case MSG_HANDSHAKE_REQ:
            send_handshake_response();
            break;
        case MSG_START_SAMPLING:
            is_sampling = true;
            sample_sequence = 0;
            break;
        case MSG_STOP_SAMPLING:
            is_sampling = false;
            break;
        default:
            break;
    }
}

void setup() {
    Serial.begin(SERIAL_BAUD);
    pinMode(LED_PIN, OUTPUT);
}

void loop() {
    // Read incoming data
    while (Serial.available()) {
        uint8_t b = Serial.read();
        
        if (b == 0x00) {
            if (rx_index > 0) {
                process_packet(rx_buffer, rx_index);
                rx_index = 0;
            }
        } else {
            if (rx_index < sizeof(rx_buffer)) {
                rx_buffer[rx_index++] = b;
            } else {
                rx_index = 0; // Buffer overflow, reset
            }
        }
    }
    
    // Sampling logic
    if (is_sampling) {
        unsigned long current_time = millis();
        if (current_time - last_sample_time >= sample_interval_ms) {
            last_sample_time = current_time;
            
            // Dummy sensor data (Accel X, Y, Z)
            float samples[3] = {
                sin(current_time / 1000.0) * 9.8,
                cos(current_time / 1000.0) * 9.8,
                9.8
            };
            
            size_t payload_len = 4 + sizeof(samples);
            packet_buffer[0] = MSG_DATA_FRAME;
            packet_buffer[1] = payload_len & 0xFF;
            packet_buffer[2] = (payload_len >> 8) & 0xFF;
            packet_buffer[3] = PROTOCOL_VERSION;
            
            // Payload: [timestamp: uint32] [samples: float32[]]
            memcpy(&packet_buffer[4], &current_time, 4);
            memcpy(&packet_buffer[8], samples, sizeof(samples));
            
            size_t tlv_len = 4 + payload_len;
            
            // CRC
            uint8_t checksum = crc8(packet_buffer, tlv_len);
            packet_buffer[tlv_len] = checksum;
            
            // COBS
            uint8_t cobs_buffer[128];
            size_t cobs_len = cobs_encode(packet_buffer, tlv_len + 1, cobs_buffer);
            
            // Send
            Serial.write(0x00);
            Serial.write(cobs_buffer, cobs_len);
            Serial.write(0x00);
            
            sample_sequence++;
        }
    }
}
