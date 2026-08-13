# Esquemático de Conexão Elétrica: ESP32 + ST7789 SPI + DHT22 + Sensor de Som

Este documento fornece os detalhes de pinagem e diagramas de ligação de todos os periféricos conectados à placa **ESP32 (ESP-WROOM-32)**.

---

## 1. Tabela de Pinagem Completa

| Periférico | Pino do Periférico | Pino no ESP32 | Tipo de Sinal | Observações |
| :--- | :---: | :---: | :---: | :--- |
| **Display ST7789** | GND | **GND** | Alimentação | Terra comum |
| | VCC | **3.3V** | Alimentação | Alimentação lógica 3.3V |
| | SCL / SCK | **GPIO 18** | SPI Clock | Barramento Hardware VSPI SCK |
| | SDA / MOSI | **GPIO 23** | SPI Data | Barramento Hardware VSPI MOSI |
| | RES / RESET | **GPIO 4** | Digital Output | Reset de hardware da tela |
| | DC / RS | **GPIO 2** | Digital Output | Seleção Dados (High) / Comando (Low) |
| | CS | **GPIO 5** | Digital Output | Habilitação do Chip Select |
| | BLK / LED | **GPIO 32** | PWM / Digital | Controle de iluminação do backlight |
| **Sensor DHT22** | VCC | **3.3V** / 5V | Alimentação | Alimentação |
| | DATA | **GPIO 15** | Digital I/O | Pull-up 10kΩ com 3.3V |
| | GND | **GND** | Alimentação | Terra comum |
| **Sensor de Som** | AO (Analog Out) | **GPIO 34** | Analog Input | Canal ADC1 (ADC1_CH6) |
| | VCC | **3.3V** / 5V | Alimentação | Alimentação |
| | GND | **GND** | Alimentação | Terra comum |
| **Atuador (LED)** | Anodo (+) | **GPIO 12** | Digital Output | Resistor limitador de 220Ω |
| **Atuador (Relé/Buzzer)**| IN / Gate | **GPIO 14** | Digital Output | Módulo Relé Optoacoplado / Transistor |

---

## 2. Diagrama de Ligação em Bloco

```text
                        +---------------------+
                        |     ESP32 BOARD     |
                        |   (ESP-WROOM-32)    |
                        +---------------------+
                         | | | | | | | | | | |
     +-------------------+ | | | | | | | | | +--------------------+
     |                     | | | | | | | | |                      |
     v                     | | | | | | | | v                      v
+----------+               | | | | | | | +----------+      +--------------+
| DHT22    |               | | | | | | | | SENSOR   |      | ATUADORES    |
| DATA:G15 |               | | | | | | | | SOM (AO) |      | LED: GPIO 12 |
+----------+               | | | | | | | | GPIO 34  |      | RELE:GPIO 14 |
                           | | | | | | | +----------+      +--------------+
                           v v v v v v v
               +----------------------------------+
               |  DISPLAY TFT ST7789 IPS 2.25"    |
               |  SCK: G18 | MOSI: G23 | RES: G4  |
               |  DC:  G2  | CS:   G5  | BLK: G32 |
               +----------------------------------+
```
