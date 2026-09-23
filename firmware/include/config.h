#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// ID Único do Dispositivo ESP32
#define DEVICE_ID "esp32-temp-01"

// ==============================================================================
// SELEÇÃO DO PERFIL DE REDE ATIVA
// Alterne entre os perfis descomentando APENAS UMA das opções abaixo:
// ==============================================================================
#define USAR_REDE_MACBOOK // Rede atual fora de casa (Broker no
                          // MacBook: 10.11.30.190)
// #define USAR_REDE_CASA    // Rede residencial (Wi-Fi "Luca" / Broker:
// 192.168.31.220)

#if defined(USAR_REDE_MACBOOK)
// --------------------------------------------------------------------------
// PERFIL: FORA DE CASA / REDE DO MACBOOK (ATIVO)
// --------------------------------------------------------------------------
// >>> DIGITE AQUI AS CREDENCIAIS DA REDE WI-FI ATUAL (FORA DE CASA) <<<
#define WIFI_SSID "daniel"
#define WIFI_PASSWORD "dan1985@"

// Endereço do Broker MQTT (IP do MacBook na rede externa atual)
#define MQTT_BROKER_HOST "10.11.30.190"
#define MQTT_BROKER_PORT 1883
#define MQTT_USER ""
#define MQTT_PASS ""

// Parâmetros da Rede Atual (Roteador e Sub-rede)
#define NETWORK_GATEWAY "10.11.30.141"
#define NETWORK_SUBNET "255.255.255.0"

// 0 = Obtém IP automaticamente via DHCP (Recomendado) | 1 = Usa IP estático
// fixo
#define USAR_IP_ESTATICO 0
#define STATIC_ESP32_IP "10.11.30.195"

#elif defined(USAR_REDE_CASA)
// --------------------------------------------------------------------------
// PERFIL: REDE DE CASA
// --------------------------------------------------------------------------
#define WIFI_SSID "Luca"
#define WIFI_PASSWORD "que1985@"

// Endereço do Servidor / Broker MQTT na rede de casa
#define MQTT_BROKER_HOST "192.168.31.220"
#define MQTT_BROKER_PORT 1883
#define MQTT_USER ""
#define MQTT_PASS ""

#define USAR_IP_ESTATICO 0

#else
#error                                                                         \
    "Por favor, selecione um perfil de rede em include/config.h (USAR_REDE_MACBOOK ou USAR_REDE_CASA)!"
#endif

// Tópicos MQTT Padronizados
#define TOPIC_TELEMETRY "v1/devices/" DEVICE_ID "/telemetry"
#define TOPIC_STATUS "v1/devices/" DEVICE_ID "/status"
#define TOPIC_COMMANDS "v1/devices/" DEVICE_ID "/commands"
#define TOPIC_ACK "v1/devices/" DEVICE_ID "/commands/ack"

// Pinos dos Periféricos Hardware no ESP32
#define PIN_DHT 15 // Sensor DHT22 / DHT11
#define DHT_TYPE DHT22

#define PIN_SOUND_ADC 34 // Sensor de Som Analógico (ADC1_CH6)

#define PIN_LED_ALERT 12      // LED de Sinalização/Alerta
#define PIN_ACTUATOR_RELAY 14 // Relé / Cooler / Buzzer

// Limiares para Regras de Alerta Ambiental
#define TEMP_THRESHOLD_HIGH 30.0    // 30°C
#define HUMIDITY_THRESHOLD_LOW 40.0 // 40%
#define NOISE_ADC_THRESHOLD 700 // Leitura ADC equivalente a ruído alto (~70dB)

// Intervalo de Leitura e Publicação da Telemetria (ms)
#define TELEMETRY_INTERVAL_MS 5000

#endif // CONFIG_H
