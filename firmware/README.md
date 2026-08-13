# Firmware ESP32: Alerta de Temperatura e Saúde Ambiental IoT

Este diretório contém o código-fonte C++ desenvolvido com o **PlatformIO** para o microcontrolador **ESP32 (ESP-WROOM-32)**.

---

## Periféricos Suportados
- **Display TFT IPS 2.25" ST7789** (barramento SPI de 8 pinos).
- **Sensor DHT22 / DHT11** (Temperatura e Umidade).
- **Sensor de Som Analógico** (Entrada ADC1).
- **Atuadores** (LED indicador e Relé/Cooler/Buzzer).

---

## Como Compilar e Gravar no ESP32

1. Certifique-se de ter a extensão **PlatformIO IDE** instalada no VS Code.
2. Abra esta pasta no PlatformIO.
3. Ajuste os dados do Wi-Fi e IP do Broker em `include/config.h`:
   ```cpp
   #define WIFI_SSID "SuaRede"
   #define WIFI_PASSWORD "SuaSenha"
   #define MQTT_BROKER_HOST "192.168.1.100"
   ```
4. Conecte o ESP32 via USB.
5. Clique em **PlatformIO: Build** e **PlatformIO: Upload**.
