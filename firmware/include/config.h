#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// ID Único do Dispositivo ESP32
#define DEVICE_ID "esp32-temp-01"

// Configurações da Rede Wi-Fi
#define WIFI_SSID "SuaRedeWiFi"
#define WIFI_PASSWORD "SuaSenhaWiFi"

// Configurações do Broker MQTT
#define MQTT_BROKER_HOST "192.168.1.100" // Altere para o IP do seu servidor
#define MQTT_BROKER_PORT 1883
#define MQTT_USER ""
#define MQTT_PASS ""

// Tópicos MQTT Padronizados
#define TOPIC_TELEMETRY "v1/devices/" DEVICE_ID "/telemetry"
#define TOPIC_STATUS    "v1/devices/" DEVICE_ID "/status"
#define TOPIC_COMMANDS  "v1/devices/" DEVICE_ID "/commands"
#define TOPIC_ACK       "v1/devices/" DEVICE_ID "/commands/ack"

// Pinos dos Periféricos Hardware no ESP32
#define PIN_DHT 15           // Sensor DHT22 / DHT11
#define DHT_TYPE DHT22

#define PIN_SOUND_ADC 34     // Sensor de Som Analógico (ADC1_CH6)

#define PIN_LED_ALERT 12     // LED de Sinalização/Alerta
#define PIN_ACTUATOR_RELAY 14// Relé / Cooler / Buzzer

// Limiares para Regras de Alerta Ambiental
#define TEMP_THRESHOLD_HIGH 30.0    // 30°C
#define HUMIDITY_THRESHOLD_LOW 40.0 // 40%
#define NOISE_ADC_THRESHOLD 700     // Leitura ADC equivalente a ruído alto (~70dB)

// Intervalo de Leitura e Publicação da Telemetria (ms)
#define TELEMETRY_INTERVAL_MS 5000

#endif // CONFIG_H
