#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// ==============================================================================
// 1. CREDENCIAIS SEGURAS (SECRETS)
// Isoladas em secrets.h conforme Seções 4.4 e 15 da Apostila do IFMG
// ==============================================================================
#if __has_include("secrets.h")
    #include "secrets.h"
#else
    #include "secrets.example.h"
#endif

// Mapeamento de variáveis para compatibilidade
#ifndef MQTT_BROKER_HOST
    #define MQTT_BROKER_HOST MQTT_HOST
#endif
#ifndef MQTT_BROKER_PORT
    #define MQTT_BROKER_PORT MQTT_PORT
#endif
#ifndef MQTT_USER
    #define MQTT_USER MQTT_USERNAME
#endif
#ifndef MQTT_PASS
    #define MQTT_PASS MQTT_PASSWORD
#endif

#ifndef USAR_IP_ESTATICO
    #define USAR_IP_ESTATICO 0
#endif

// ==============================================================================
// 2. IDENTIFICAÇÃO E CONVENÇÃO DE NAMESPACE DA DISCIPLINA (IFMG - IOT3)
// Conforme Seções 7 e 8 da Apostila Prática da Etapa 1 (Prof. Charles Garrocho)
// ==============================================================================
#define IOT_TURMA        "turmaA"
#define IOT_ALUNO        "daniel"
#define IOT_DISPOSITIVO  "esp32_temp"

#define DEVICE_ID        IOT_DISPOSITIVO
#define MQTT_CLIENT_ID   "ifmg_iot3_" IOT_TURMA "_" IOT_ALUNO "_" IOT_DISPOSITIVO

// Tópicos Oficiais Obrigatórios do IFMG
#define TOPIC_TELEMETRY    "ifmg/iot3/" IOT_TURMA "/" IOT_ALUNO "/" IOT_DISPOSITIVO "/telemetry"
#define TOPIC_COMMAND      "ifmg/iot3/" IOT_TURMA "/" IOT_ALUNO "/" IOT_DISPOSITIVO "/command"
#define TOPIC_STATE        "ifmg/iot3/" IOT_TURMA "/" IOT_ALUNO "/" IOT_DISPOSITIVO "/state"
#define TOPIC_AVAILABILITY "ifmg/iot3/" IOT_TURMA "/" IOT_ALUNO "/" IOT_DISPOSITIVO "/availability"

// Aliases de compatibilidade
#define TOPIC_COMMANDS     TOPIC_COMMAND
#define TOPIC_STATUS       TOPIC_AVAILABILITY
#define TOPIC_ACK          TOPIC_STATE

// ==============================================================================
// 3. PINOS DE PERIFÉRICOS E HARDWARE NO ESP32
// ==============================================================================
#define PIN_DHT 15               // Sensor DHT22 (Temperatura e Umidade)
#define DHT_TYPE DHT22

#define PIN_SOUND_ADC 34         // Sensor de Som Analógico (ADC1_CH6)

#define PIN_LED_ALERT 12         // LED de Sinalização / Alerta Visual
#define PIN_ACTUATOR_RELAY 14    // Relé / Atuador de Potência (Cooler)

// ==============================================================================
// 4. LIMIARES PARA REGRAS DE ALERTA AMBIENTAL
// ==============================================================================
#define TEMP_THRESHOLD_HIGH 30.0    // 30°C
#define HUMIDITY_THRESHOLD_LOW 40.0 // 40%
#define NOISE_ADC_THRESHOLD 700     // ADC equivalente a ruído alto (~70dB)

// Intervalo de leitura e publicação da telemetria (ms)
#define TELEMETRY_INTERVAL_MS 5000

#endif // CONFIG_H
