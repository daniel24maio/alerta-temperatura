#include "mqtt_client.h"
#include "config.h"
#include <ArduinoJson.h>

static WiFiClient espClient;
static PubSubClient client(espClient);
static unsigned long lastMqttReconnectAttempt = 0;

void MQTTClientManager::setup(void (*commandCallback)(char*, byte*, unsigned int)) {
    client.setServer(MQTT_BROKER_HOST, MQTT_BROKER_PORT);
    client.setCallback(commandCallback);
    client.setBufferSize(512); // Amplia buffer para suportar payloads JSON completos
}

void MQTTClientManager::reconnect() {
    unsigned long now = millis();
    if (now - lastMqttReconnectAttempt > 5000) {
        lastMqttReconnectAttempt = now;
        Serial.println("[MQTT] Tentando conexão ao broker...");
        Serial.print("[MQTT] Broker: "); Serial.print(MQTT_BROKER_HOST);
        Serial.print(":"); Serial.println(MQTT_BROKER_PORT);
        Serial.print("[MQTT] Client ID: "); Serial.println(MQTT_CLIENT_ID);

        // LWT (Last Will and Testament) conforme Seção 8.4 da Apostila IFMG:
        // Tópico: .../availability, QoS: 1, Retain: true, Payload: "offline"
        if (client.connect(MQTT_CLIENT_ID, MQTT_USER, MQTT_PASS, TOPIC_AVAILABILITY, 1, true, "offline")) {
            Serial.println("[MQTT] >>> Conectado com sucesso! <<<");
            
            // Publica status Online imediatamente com Retain True
            publishStatusOnline();

            // Subscreve ao tópico de comandos com QoS 1
            client.subscribe(TOPIC_COMMAND, 1);
            Serial.print("[MQTT] Inscrito no tópico de comandos: ");
            Serial.println(TOPIC_COMMAND);
        } else {
            Serial.print("[MQTT] Falha na conexão, rc=");
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

    // Conforme Seção 8.4 da Apostila do IFMG:
    // String simples "online" com flag retained = true
    bool ok = client.publish(TOPIC_AVAILABILITY, "online", true);
    if (ok) {
        Serial.print("[MQTT] Disponibilidade publicada ('online', Retain=true) em: ");
        Serial.println(TOPIC_AVAILABILITY);
    }
    return ok;
}

bool MQTTClientManager::publishState(const char* actuator, bool state, const char* requestId) {
    if (!client.connected()) return false;

    // Conforme Seção 8.3 da Apostila do IFMG:
    // Payload JSON publicado no tópico .../state com flag retained = true
    StaticJsonDocument<256> doc;
    doc["deviceId"] = DEVICE_ID;
    doc["actuator"] = (actuator && strlen(actuator) > 0) ? actuator : "led";
    doc["state"] = state;
    if (requestId && strlen(requestId) > 0) {
        doc["requestId"] = requestId;
    }
    doc["timestamp"] = millis() / 1000;

    char buffer[256];
    serializeJson(doc, buffer);

    bool ok = client.publish(TOPIC_STATE, buffer, true);
    if (ok) {
        Serial.print("[MQTT] Estado confirmado ('state', Retain=true) em ");
        Serial.print(TOPIC_STATE);
        Serial.print(": ");
        Serial.println(buffer);
    }
    return ok;
}

bool MQTTClientManager::publishACK(const char* commandId, bool success, bool state) {
    // Mantém compatibilidade com chamadas legadas encaminhando para publishState
    return publishState("actuator", state, commandId);
}

