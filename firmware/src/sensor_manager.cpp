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

    // Avaliação das 4 Regras de Saúde & Conforto Ambiental
    data.requiresActuator = false;

    // Regra 3: Alta Temperatura (>30C) E Baixa Umidade (<40%) - Crítico!
    if (t > TEMP_THRESHOLD_HIGH && h < HUMIDITY_THRESHOLD_LOW) {
        data.alertCode = "CRITICAL_HEAT_DRY";
        data.lcdMessage = "CRITICO: Temp/Umid! Hidratar & ativ. baixa intens.";
        data.requiresActuator = true;
    }
    // Regra 1: Alta Temperatura (>30C)
    else if (t > TEMP_THRESHOLD_HIGH) {
        data.alertCode = "HIGH_TEMP";
        data.lcdMessage = "ALERTA: Temp >30C! Beba agua & ar em circulacao";
        data.requiresActuator = true;
    }
    // Regra 2: Temperatura amena E Baixa Umidade (<40%)
    else if (t >= 18.0f && t <= TEMP_THRESHOLD_HIGH && h < HUMIDITY_THRESHOLD_LOW) {
        data.alertCode = "LOW_HUMIDITY_MILD";
        data.lcdMessage = "ALERTA: Baixa umid! Hidrate-se / Evite ex. intenso";
    }
    // Regra 4: Muito Barulho no Ambiente
    else if (noiseRaw > NOISE_ADC_THRESHOLD || noiseDb > 75) {
        data.alertCode = "HIGH_NOISE";
        data.lcdMessage = "ALERTA: Ruido alto! Favor manter silencio no local";
        data.requiresActuator = true;
    }
    // Condição Normal
    else {
        data.alertCode = "NONE";
        data.lcdMessage = "Ambiente OK - Condicoes ideais";
    }

    return data;
}
