#include "wifi_manager.h"
#include "config.h"

static unsigned long lastReconnectAttempt = 0;
static bool wasConnected = false;

void WiFiManager::setup() {
    WiFi.mode(WIFI_STA);

#if defined(USAR_IP_ESTATICO) && (USAR_IP_ESTATICO == 1)
    IPAddress local_IP, gateway, subnet, dns(8, 8, 8, 8);
    local_IP.fromString(STATIC_ESP32_IP);
    gateway.fromString(NETWORK_GATEWAY);
    subnet.fromString(NETWORK_SUBNET);
    WiFi.config(local_IP, gateway, subnet, dns);
    Serial.println("Configurando IP Estático no ESP32...");
#endif

    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.print("Conectando ao Wi-Fi: ");
    Serial.println(WIFI_SSID);
}

void WiFiManager::loop() {
    bool currentlyConnected = (WiFi.status() == WL_CONNECTED);

    if (currentlyConnected && !wasConnected) {
        wasConnected = true;
        Serial.println("\n=============================================");
        Serial.println(">>> Wi-Fi Conectado com Sucesso! <<<");
        Serial.print("SSID Conectado: "); Serial.println(WIFI_SSID);
        Serial.print("IP do ESP32:    "); Serial.println(WiFi.localIP());
        Serial.print("Máscara Subrede:"); Serial.println(WiFi.subnetMask());
        Serial.print("Gateway/Router: "); Serial.println(WiFi.gatewayIP());
        Serial.print("Broker MQTT:    "); Serial.print(MQTT_BROKER_HOST);
        Serial.print(":"); Serial.println(MQTT_BROKER_PORT);
        Serial.println("=============================================\n");
    } else if (!currentlyConnected && wasConnected) {
        wasConnected = false;
        Serial.println("[Wi-Fi] Conexão perdida. Tentando restabelecer...");
    }

    if (!currentlyConnected) {
        unsigned long now = millis();
        if (now - lastReconnectAttempt > 10000) { // Tenta reconectar a cada 10s sem bloquear
            lastReconnectAttempt = now;
            Serial.println("Tentando reconexão Wi-Fi...");
            WiFi.disconnect();
            WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
        }
    }
}

bool WiFiManager::isConnected() {
    return (WiFi.status() == WL_CONNECTED);
}
