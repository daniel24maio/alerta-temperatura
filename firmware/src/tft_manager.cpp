#include "tft_manager.h"
#include <SPI.h>

static TFT_eSPI tft = TFT_eSPI();

void TFTManager::setup() {
    tft.init();
    tft.setRotation(1); // Modo Landscape (284x76)
    tft.fillScreen(TFT_BLACK);
    tft.setTextColor(TFT_WHITE, TFT_BLACK);
}

void TFTManager::renderDashboard(const SensorData& data, bool actuatorState, bool wifiConnected, bool mqttConnected) {
    tft.fillScreen(TFT_BLACK);

    // Linha Superior (Métricas)
    // Temperatura
    tft.drawString("TEMP:", 5, 5, 2);
    if (data.temperature > 30.0f) {
        tft.setTextColor(TFT_RED, TFT_BLACK);
    } else {
        tft.setTextColor(TFT_GREEN, TFT_BLACK);
    }
    tft.drawFloat(data.temperature, 1, 55, 5, 2);
    tft.drawString("C", 100, 5, 2);

    // Umidade
    tft.setTextColor(TFT_CYAN, TFT_BLACK);
    tft.drawString("UMID:", 120, 5, 2);
    tft.drawFloat(data.humidity, 1, 165, 5, 2);
    tft.drawString("%", 210, 5, 2);

    // Ruído
    tft.setTextColor(TFT_YELLOW, TFT_BLACK);
    tft.drawString("SOM:", 225, 5, 2);
    tft.drawNumber(data.noiseLevel, 260, 5, 2);

    // Linha Divisória
    tft.drawLine(0, 25, 284, 25, TFT_DARKGREY);

    // Linha Central: Status Conexão & Atuador
    tft.setTextColor(TFT_WHITE, TFT_BLACK);
    tft.drawString("NET:", 5, 30, 2);
    tft.drawString(wifiConnected ? "OK" : "ERR", 40, 30, 2);

    tft.drawString("MQTT:", 75, 30, 2);
    tft.drawString(mqttConnected ? "OK" : "ERR", 120, 30, 2);

    tft.drawString("ATUADOR:", 160, 30, 2);
    if (actuatorState) {
        tft.setTextColor(TFT_GREEN, TFT_BLACK);
        tft.drawString("LIGADO", 230, 30, 2);
    } else {
        tft.setTextColor(TFT_RED, TFT_BLACK);
        tft.drawString("DESLIG", 230, 30, 2);
    }

    // Linha Divisória
    tft.drawLine(0, 50, 284, 50, TFT_DARKGREY);

    // Linha Inferior: Banner de Alerta Ambiental
    if (data.alertCode != "NONE") {
        tft.fillRect(0, 52, 284, 24, TFT_RED);
        tft.setTextColor(TFT_WHITE, TFT_RED);
    } else {
        tft.fillRect(0, 52, 284, 24, TFT_NAVY);
        tft.setTextColor(TFT_GREEN, TFT_NAVY);
    }
    tft.drawString(data.lcdMessage.c_str(), 5, 56, 2);
}

void TFTManager::showMessage(const char* title, const char* msg) {
    tft.fillScreen(TFT_BLACK);
    tft.setTextColor(TFT_YELLOW, TFT_BLACK);
    tft.drawString(title, 10, 10, 4);
    tft.setTextColor(TFT_WHITE, TFT_BLACK);
    tft.drawString(msg, 10, 45, 2);
}
