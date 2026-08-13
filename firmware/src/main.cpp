#include <Arduino.h>
#include <ArduinoJson.h>
#include "config.h"
#include "wifi_manager.h"
#include "mqtt_client.h"
#include "sensor_manager.h"
#include "tft_manager.h"
#include "actuator_manager.h"

static unsigned long lastTelemetryTime = 0;

// Callback chamado ao receber comandos MQTT do Gateway
void handleMqttCommand(char* topic, byte* payload, unsigned int length) {
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, payload, length);

    if (error) {
        Serial.print("Erro ao deserializar comando JSON: ");
        Serial.println(error.f_str());
        return;
    }

    const char* commandId = doc["commandId"] | "";
    const char* action = doc["action"] | "";
    bool requestedState = doc["state"] | false;

    Serial.print("Comando Recebido ID: ");
    Serial.print(commandId);
    Serial.print(" Action: ");
    Serial.println(action);

    if (String(action) == "SET_ACTUATOR") {
        ActuatorManager::setActuatorState(requestedState);
        // Publica Confirmação ACK
        MQTTClientManager::publishACK(commandId, true, requestedState);
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

        // Leitura dos sensores e avaliação das regras
        SensorData sensorData = SensorManager::readSensors();

        // Se a regra exigir atuador ativado (ex: Temperatura > 30C ou Ruído alto), atualiza o estado
        if (sensorData.requiresActuator && !ActuatorManager::getActuatorState()) {
            ActuatorManager::setActuatorState(true);
        }

        // Renderização no Display TFT ST7789
        TFTManager::renderDashboard(
            sensorData, 
            ActuatorManager::getActuatorState(), 
            WiFiManager::isConnected(), 
            MQTTClientManager::isConnected()
        );

        // Montagem do Payload JSON de Telemetria
        StaticJsonDocument<512> doc;
        doc["temp"] = sensorData.temperature;
        doc["humidity"] = sensorData.humidity;
        doc["noiseLevel"] = sensorData.noiseLevel;
        
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
            Serial.println("Telemetria publicada via MQTT.");
        }
    }
}
