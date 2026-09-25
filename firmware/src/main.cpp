#include <Arduino.h>
#include <ArduinoJson.h>
#include "config.h"
#include "wifi_manager.h"
#include "mqtt_client.h"
#include "sensor_manager.h"
#include "tft_manager.h"
#include "actuator_manager.h"

static unsigned long lastTelemetryTime = 0;
static uint32_t telemetrySequence = 0;

// Callback chamado ao receber comandos MQTT do Broker / Gateway
void handleMqttCommand(char* topic, byte* payload, unsigned int length) {
    StaticJsonDocument<384> doc;
    DeserializationError error = deserializeJson(doc, payload, length);

    if (error) {
        Serial.print("[MQTT] ERRO: Payload de comando inválido / não-JSON: ");
        Serial.println(error.f_str());
        return;
    }

    // Padrão IFMG (Seção 8.2 da Apostila):
    // { "action": "set", "target": "led", "value": true, "requestId": "..." }
    // Compatibilidade com formato legado:
    // { "action": "SET_ACTUATOR", "state": true, "commandId": "..." }
    const char* action = doc["action"] | "";
    const char* target = doc["target"] | "led";
    const char* requestId = doc["requestId"] | (doc["commandId"] | "req-default");

    bool hasState = doc.containsKey("value") || doc.containsKey("state");
    bool requestedState = doc.containsKey("value") ? doc["value"].as<bool>() : doc["state"].as<bool>();

    Serial.println("\n---------------------------------------------");
    Serial.println("[MQTT] >>> Comando Recebido no Tópico <<<");
    Serial.print("Tópico:    "); Serial.println(topic);
    Serial.print("Action:    "); Serial.println(action);
    Serial.print("Target:    "); Serial.println(target);
    Serial.print("Value:     "); Serial.println(requestedState ? "true (LIGAR)" : "false (DESLIGAR)");
    Serial.print("RequestId: "); Serial.println(requestId);
    Serial.println("---------------------------------------------");

    String actStr = String(action);
    actStr.toLowerCase();

    if (actStr == "set" || String(action) == "SET_ACTUATOR") {
        if (!hasState) {
            Serial.println("[MQTT] AVISO: Comando rejeitado (campo 'value' ou 'state' ausente).");
            return;
        }

        // Aplica o acionamento físico no hardware
        ActuatorManager::setActuatorState(requestedState);

        // Publica Confirmação de Estado no tópico .../state com retain=true (Item 10)
        MQTTClientManager::publishState(target, requestedState, requestId);
    } else {
        Serial.print("[MQTT] AVISO: Ação não suportada recebida: '");
        Serial.print(action);
        Serial.println("'. Nenhuma alteração realizada.");
    }
}

void setup() {
    Serial.begin(115200);
    Serial.println("\n--- Inicializando ESP32 IoT Alerta de Temperatura ---");

    TFTManager::setup();
    TFTManager::showMessage("INICIALIZANDO", "Conectando sensores e rede...");

    ActuatorManager::setup();
    SensorManager::setup();
    WiFiManager::setup();
    MQTTClientManager::setup(handleMqttCommand);
}

void loop() {
    // Loop de redes e conectividade não-bloqueante
    WiFiManager::loop();
    MQTTClientManager::loop();

    unsigned long now = millis();
    if (now - lastTelemetryTime >= TELEMETRY_INTERVAL_MS) {
        lastTelemetryTime = now;
        telemetrySequence++;

        // Leitura dos sensores e avaliação das regras
        SensorData sensorData = SensorManager::readSensors();

        // Se a regra exigir atuador ativado (ex: Temperatura > 30C ou Ruído alto), atualiza o estado
        if (sensorData.requiresActuator && !ActuatorManager::getActuatorState()) {
            ActuatorManager::setActuatorState(true);
            MQTTClientManager::publishState("led", true, "auto-rule-alert");
        }

        // Renderização no Display TFT ST7789
        TFTManager::renderDashboard(
            sensorData, 
            ActuatorManager::getActuatorState(), 
            WiFiManager::isConnected(), 
            MQTTClientManager::isConnected()
        );

        // Montagem do Payload JSON Canônico do IFMG (Seção 8.1 da Apostila)
        // Mais campos complementares para o dashboard e display
        StaticJsonDocument<512> doc;
        doc["deviceId"] = DEVICE_ID;
        doc["sensor"] = "dht22_temperatura";
        doc["value"] = round(sensorData.temperature * 10.0) / 10.0;
        doc["unit"] = "C";
        doc["humidity"] = round(sensorData.humidity * 10.0) / 10.0;
        doc["noiseLevel"] = sensorData.noiseLevel;
        doc["sequence"] = telemetrySequence;
        doc["uptimeMs"] = now;
        doc["wifiRssi"] = WiFi.RSSI();

        // Campos de compatibilidade com o ecossistema existente
        doc["temp"] = sensorData.temperature;
        doc["lux"] = sensorData.lux;
        JsonArray alerts = doc.createNestedArray("alerts");
        if (sensorData.alertCode != "NONE") {
            alerts.add(sensorData.alertCode);
        }

        doc["lcdText"] = sensorData.lcdMessage;
        doc["displayType"] = "ST7789_SPI";
        doc["actuatorState"] = ActuatorManager::getActuatorState();
        doc["timestamp"] = now / 1000;

        char jsonBuffer[512];
        serializeJson(doc, jsonBuffer);

        // Publicação MQTT
        if (MQTTClientManager::isConnected()) {
            MQTTClientManager::publishTelemetry(jsonBuffer);
            Serial.print("[MQTT] Telemetria #");
            Serial.print(telemetrySequence);
            Serial.print(" enviada para ");
            Serial.print(TOPIC_TELEMETRY);
            Serial.print(" | ");
            Serial.println(jsonBuffer);
        }
    }
}
