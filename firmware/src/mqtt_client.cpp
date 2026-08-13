#include "mqtt_client.h"
#include "config.h"
#include <ArduinoJson.h>

static WiFiClient espClient;
static PubSubClient client(espClient);
static unsigned long lastMqttReconnectAttempt = 0;

void MQTTClientManager::setup(void (*commandCallback)(char*, byte*, unsigned int)) {
    client.setServer(MQTT_BROKER_HOST, MQTT_BROKER_PORT);
    client.setCallback(commandCallback);
}

void MQTTClientManager::reconnect() {
    unsigned long now = millis();
    if (now - lastMqttReconnectAttempt > 5000) {
        lastMqttReconnectAttempt = now;
        Serial.println("Tentando conexão MQTT...");

        // Payload de LWT (Last Will and Testament) em JSON (QoS 1, Retain True)
        StaticJsonDocument<128> lwtDoc;
        lwtDoc["status"] = "offline";
        lwtDoc["reason"] = "unexpected_disconnect";
        lwtDoc["timestamp"] = millis() / 1000;
        char lwtBuffer[128];
        serializeJson(lwtDoc, lwtBuffer);

        if (client.connect(DEVICE_ID, MQTT_USER, MQTT_PASS, TOPIC_STATUS, 1, true, lwtBuffer)) {
            Serial.println("MQTT Conectado com sucesso!");
            
            // Publica status Online
            publishStatusOnline();

            // Subscreve ao tópico de comandos
            client.subscribe(TOPIC_COMMANDS, 1);
        } else {
            Serial.print("Falha MQTT, rc=");
            Serial.println(client.state());
        }
    }
}

void MQTTClientManager::loop() {
    if (!client.connected()) {
        reconnect();
    } else {
        client.loop();
    }
}

bool MQTTClientManager::isConnected() {
    return client.connected();
}

bool MQTTClientManager::publishTelemetry(const char* jsonPayload) {
    if (!client.connected()) return false;
    return client.publish(TOPIC_TELEMETRY, jsonPayload, false);
}

bool MQTTClientManager::publishStatusOnline() {
    if (!client.connected()) return false;

    StaticJsonDocument<256> doc;
    doc["status"] = "online";
    doc["ip"] = WiFi.localIP().toString();
    doc["firmwareVersion"] = "1.0.0";
    doc["uptime"] = millis() / 1000;

    char buffer[256];
    serializeJson(doc, buffer);
    return client.publish(TOPIC_STATUS, buffer, true);
}

bool MQTTClientManager::publishACK(const char* commandId, bool success, bool state) {
    if (!client.connected()) return false;

    StaticJsonDocument<256> doc;
    doc["commandId"] = commandId;
    doc["success"] = success;
    doc["state"] = state;
    doc["timestamp"] = millis() / 1000;

    char buffer[256];
    serializeJson(doc, buffer);
    return client.publish(TOPIC_ACK, buffer, false);
}
