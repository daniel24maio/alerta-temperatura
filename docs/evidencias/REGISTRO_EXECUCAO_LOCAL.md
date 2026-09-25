# Registro de Execução e Evidências em Tempo Real — Etapa 1
**Data e Hora do Ensaio**: 24 de Setembro de 2026  
**Ambiente de Rede**: Rede Externa / MacBook Hotspot (`USAR_REDE_MACBOOK`)  
**SSID**: `daniel` | **Broker MQTT**: `10.11.30.190:1883`  
**Dispositivo**: `esp32_temp` (ESP32 DevKit V1 conectado em `/dev/cu.usbserial-5B520923941`)  

---

## 1. Status dos Serviços Locais em Execução

| Serviço | Porta / Endpoint | Status | Função |
| :--- | :--- | :---: | :--- |
| **Mosquitto MQTT Broker** | `0.0.0.0:1883` (TCP) / `9001` (WS) | 🟢 **ATIVO (Docker)** | Roteamento das mensagens Pub/Sub entre ESP32, Gateway e Clientes |
| **Banco Redis KV** | `0.0.0.0:6379` | 🟢 **ATIVO (Docker)** | Armazenamento de telemetria, último estado e presença do dispositivo |
| **Backend Gateway Node.js** | `http://localhost:5001/api` | 🟢 **ATIVO** | Validação Zod, controle REST HTTP e ingestão contínua MQTT |
| **Frontend Web SPA React** | `http://localhost:3000` | 🟢 **ATIVO** | Painel visual em tempo real com controle do atuador simulado |

---

## 2. Evidência 1: Conexão Wi-Fi e Serial Monitor (`wifi_conectado.png`)

**Captura real do console serial do ESP32:**
```text
=============================================
>>> Wi-Fi Conectado com Sucesso! <<<
SSID Conectado: daniel
IP do ESP32:    10.11.30.195
Máscara Subrede:255.255.255.0
Gateway/Router: 10.11.30.141
Broker MQTT:    10.11.30.190:1883
=============================================
[MQTT] Tentando conexão ao broker...
[MQTT] Broker: 10.11.30.190:1883
[MQTT] Client ID: ifmg_iot3_turmaA_daniel_esp32_temp
[MQTT] >>> Conectado com sucesso! <<<
[MQTT] Disponibilidade publicada ('online', Retain=true) em: ifmg/iot3/turmaA/daniel/esp32_temp/availability
[MQTT] Inscrito no tópico de comandos: ifmg/iot3/turmaA/daniel/esp32_temp/command
```

---

## 3. Evidência 2: Publicação Periódica de Telemetria (`mqtt_publicacao.png`)

**Mensagem real capturada do tópico `ifmg/iot3/turmaA/daniel/esp32_temp/telemetry`:**
```json
{
  "deviceId": "esp32_temp",
  "sensor": "dht22_temperatura",
  "value": 22.2,
  "unit": "C",
  "humidity": 74.8,
  "noiseLevel": 42,
  "sequence": 73,
  "uptimeMs": 365000,
  "wifiRssi": -48,
  "temp": 22.2,
  "lux": 103.3,
  "alerts": [],
  "lcdText": "Ambiente OK - Condicoes ideais",
  "displayType": "ST7789_SPI",
  "actuatorState": false,
  "timestamp": 365
}
```

---

## 4. Evidência 3: Acionamento Remoto do LED / Simulador de Atuador (`mqtt_comando.png`)

### A. Comando Enviado (`.../command`)
- **Tópico**: `ifmg/iot3/turmaA/daniel/esp32_temp/command`
- **Payload**:
```json
{
  "action": "set",
  "target": "led",
  "value": true,
  "requestId": "cmd_647j0mm"
}
```

### B. Efeito Físico e Confirmação de Estado (`.../state`)
- **Ação Física**: LED no pino GPIO 12 acendeu imediatamente.
- **Tópico de Confirmação**: `ifmg/iot3/turmaA/daniel/esp32_temp/state`
- **Flag MQTT**: `retained = true`
- **Payload**:
```json
{
  "deviceId": "esp32_temp",
  "actuator": "led",
  "state": true,
  "requestId": "cmd_647j0mm",
  "timestamp": 372
}
```

---

## 5. Instruções Rápidas para Salvar as Imagens PNG

Para completar a pasta de evidências conforme a Seção 4.3 da apostila:
1. Abra o **MQTT Explorer** ou terminal serial e tire os 3 prints salvando com os nomes:
   - `docs/evidencias/wifi_conectado.png`
   - `docs/evidencias/mqtt_publicacao.png`
   - `docs/evidencias/mqtt_comando.png`
