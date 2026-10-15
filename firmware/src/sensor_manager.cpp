#include "sensor_manager.h"
#include "config.h"
#include <Wire.h>
#include <BH1750.h>

static DHT dht(PIN_DHT, DHT_TYPE);
static BH1750 lightMeter;
static bool hasLightMeter = false;

void SensorManager::setup() {
    dht.begin();
    pinMode(PIN_SOUND_ADC, INPUT);

    // Inicializa I2C nos pinos SDA=21 e SCL=22
    Wire.begin(21, 22);
    Wire.setTimeOut(50);
    Serial.println("Escaneando I2C (SDA=21, SCL=22)...");
    int count = 0;
    for (byte addr = 1; addr < 127; addr++) {
        Wire.beginTransmission(addr);
        if (Wire.endTransmission() == 0) {
            Serial.print("Dispositivo I2C encontrado no endereco 0x");
            if (addr < 16) Serial.print("0");
            Serial.println(addr, HEX);
            count++;
        }
    }
    if (count == 0) {
        Serial.println("Nenhum dispositivo I2C respondeu em SDA=21, SCL=22.");
    }

    if (lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE)) {
        hasLightMeter = true;
        Serial.println("Sensor BH1750 (Luminosidade) inicializado no endereco 0x23.");
    } else if (lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE, 0x5C)) {
        hasLightMeter = true;
        Serial.println("Sensor BH1750 inicializado no endereco 0x5C.");
    } else {
        Serial.println("Aviso: BH1750 nao encontrado no barramento I2C.");
    }
}

SensorData SensorManager::readSensors() {
    SensorData data;
    
    // Leitura do DHT22
    float t = dht.readTemperature();
    float h = dht.readHumidity();

    // Fallback de segurança se falhar a leitura física
    if (isnan(t)) t = 25.0f;
    if (isnan(h)) h = 50.0f;

    data.temperature = t;
    data.humidity = h;

    // Leitura de Luminosidade (Lux)
    float lux = 0.0f;
    if (hasLightMeter) {
        lux = lightMeter.readLightLevel();
        if (lux < 0) lux = 0.0f;
    }
    data.lux = lux;

    // Amostragem ADC de Som Ambiente (calculando pico a pico / nível relativo)
    long sum = 0;
    for (int i = 0; i < 50; i++) {
        sum += analogRead(PIN_SOUND_ADC);
        delayMicroseconds(100);
    }
    int noiseRaw = sum / 50;
    // Mapeia aproximadamente em dB relativo (40 a 90 dB)
    int noiseDb = map(constrain(noiseRaw, 0, 4095), 0, 4095, 40, 95);
    data.noiseLevel = noiseDb;

    // Avaliação de Conformidade dos Sensores (Refletindo no status do ambiente somente o item fora da conformidade)
    data.requiresActuator = false;

    std::vector<String> itensForaConformidade;
    if (t > TEMP_THRESHOLD_HIGH) {
        itensForaConformidade.push_back("TEMPERATURA");
    }
    if (h < HUMIDITY_THRESHOLD_LOW) {
        itensForaConformidade.push_back("UMIDADE");
    }
    if (noiseRaw > NOISE_ADC_THRESHOLD || noiseDb > 75) {
        itensForaConformidade.push_back("RUIDO");
    }
    if (hasLightMeter && lux > 0 && (lux < 100.0f || lux > 1500.0f)) {
        itensForaConformidade.push_back("LUMINOSIDADE");
    }

    if (itensForaConformidade.empty()) {
        data.alertCode = "NONE";
        data.lcdMessage = "AMBIENTE EM CONFORMIDADE";
        data.requiresActuator = false;
    } else {
        // Se qualquer um dos índices estiver fora de conformidade, liga o atuador
        data.requiresActuator = true;
        String itensStr = "";
        for (size_t i = 0; i < itensForaConformidade.size(); i++) {
            if (i > 0) itensStr += ", ";
            itensStr += itensForaConformidade[i];
        }
        data.alertCode = itensForaConformidade[0] + "_FORA_CONFORMIDADE";
        data.lcdMessage = "FORA DE CONFORMIDADE: " + itensStr;
    }

    return data;
}
