#include "wifi_manager.h"
#include "config.h"

static unsigned long lastReconnectAttempt = 0;

void WiFiManager::setup() {
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.print("Conectando ao Wi-Fi: ");
    Serial.println(WIFI_SSID);
}

void WiFiManager::loop() {
    if (WiFi.status() != WL_CONNECTED) {
        unsigned long now = millis();
        if (now - lastReconnectAttempt > 10000) { // Tenta reconectar a cada 10s sem bloquear
            lastReconnectAttempt = now;
            Serial.println("Tentando reconexão Wi-Fi...");
            WiFi.disconnect();
            WiFi.rebegin();
        }
    }
}

bool WiFiManager::isConnected() {
    return (WiFi.status() == WL_CONNECTED);
}
