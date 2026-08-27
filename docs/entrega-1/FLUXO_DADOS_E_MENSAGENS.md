# Documentação do Fluxo de Dados e Mensagens - Entrega 1

Este documento especifica os fluxos de dados, tópicos MQTT, estrutura de payloads JSON, níveis de Qualidade de Serviço (QoS), Retenção e mensagens de presença (LWT) que trafegam na solução **Alerta de Temperatura e Saúde Ambiental IoT**.

---

## 1. Mapeamento Geral de Tópicos MQTT

Todos os tópicos seguem o padrão padronizado com versionamento `v1` e identificador dinâmico do dispositivo `{deviceId}` (ex: `esp32-temp-01`):

| Tópico MQTT | Sentido da Comunicação | QoS | Retain | Descrição / Finalidade |
| :--- | :---: | :---: | :---: | :--- |
| `v1/devices/{deviceId}/telemetry` | ESP32 -> Gateway | **1** | `false` | Publicação periódica (a cada 5s) das leituras de temperatura, umidade, ruído, código de alerta, mensagem LCD e estado do atuador. |
| `v1/devices/{deviceId}/status` | ESP32 -> Gateway | **1** | **`true`** | Registro de presença `online` na conexão e mensagem **Last Will and Testament (LWT)** `offline` enviada automaticamente pelo broker em desconexão. |
| `v1/devices/{deviceId}/commands` | Gateway -> ESP32 | **1** | `false` | Envio de comandos remotos de acionamento do atuador (ex: ligar/desligar cooler ou LED). |
| `v1/devices/{deviceId}/commands/ack` | ESP32 -> Gateway | **1** | `false` | Confirmação de execução emitida pelo ESP32 após alterar o pino GPIO. |

---

## 2. Diagramas de Sequência dos Fluxos de Dados

### 2.1 Fluxo 1: Conexão do ESP32 e Registro de Presença (LWT)

```mermaid
sequenceDiagram
    autonumber
    participant ESP32 as ESP32 (Dispositivo)
    participant Broker as Broker MQTT (Mosquitto)
    participant Gateway as Backend Gateway (Node.js)
    participant Redis as Banco Redis

    ESP32->>Broker: CONNECT (ClientID: "esp32-temp-01", LWT: Topic "v1/devices/esp32-temp-01/status", Payload {"status":"offline"})
    Broker-->>ESP32: CONNACK (Sucesso)
    
    ESP32->>Broker: PUBLISH (Topic "v1/devices/esp32-temp-01/status", Payload {"status":"online","ip":"192.168.1.105"}, QoS 1, Retain True)
    Broker->>Gateway: Evento de Mensagem em "v1/devices/+/status"
    Gateway->>Redis: Atualiza Registro de Presença (device:esp32-temp-01:presence = online, lastSeen = Now)
```

### 2.2 Fluxo 2: Leitura dos Sensores, Atualização da Tela e Publicação de Telemetria

```mermaid
sequenceDiagram
    autonumber
    participant Sensors as DHT22 & Som ADC
    participant ESP32 as ESP32 (Dispositivo)
    participant ST7789 as Display ST7789 SPI
    participant Broker as Broker MQTT
    participant Gateway as Backend Gateway
    participant Redis as Banco Redis
    participant React as Frontend React SPA

    loop A cada 5 segundos
        Sensors->>ESP32: Leitura Temp (32.5°C), Umidade (35%) e Ruído (78 dB)
        ESP32->>ESP32: Avalia Regras: Temp > 30°C e Ruído > 75dB -> Alerta: "CRITICAL_HEAT_DRY" / "HIGH_NOISE"
        ESP32->>ST7789: Atualiza Tela IPS (Métricas + Faixa Vermelha de Alerta)
        ESP32->>Broker: PUBLISH "v1/devices/esp32-temp-01/telemetry" (Payload JSON, QoS 1)
        Broker->>Gateway: Repassa mensagem (Assinatura Wildcard v1/devices/+/telemetry)
        Gateway->>Gateway: Valida Payload JSON com Zod Schema
        Gateway->>Redis: Salva Estado Atual em "device:esp32-temp-01:presence"
        Gateway->>Redis: Adiciona Item na Lista de Histórico "device:esp32-temp-01:history"
        React->>Gateway: GET /api/devices/esp32-temp-01 (Polling 3s)
        Gateway-->>React: Retorna JSON do Estado Atual
        React->>React: Re-renderiza Dashboard, Gauges e Display ST7789 Virtual
    end
```

### 2.3 Fluxo 3: Envio de Comando Remoto do Atuador com Confirmação ACK

```mermaid
sequenceDiagram
    autonumber
    actor User as Operador / Usuário
    participant React as Frontend React SPA
    participant Gateway as Backend Gateway
    participant Broker as Broker MQTT
    participant ESP32 as ESP32 (Dispositivo)
    participant Actuator as Pino GPIO 14 (Relé/Cooler)

    User->>React: Clica em "Alternar Estado do Atuador"
    React->>Gateway: POST /api/devices/esp32-temp-01/command (Body: {"action":"SET_ACTUATOR","state":true}, Basic Auth)
    Gateway->>Broker: PUBLISH "v1/devices/esp32-temp-01/commands" (Payload: {"commandId":"cmd-123","action":"SET_ACTUATOR","state":true}, QoS 1)
    Broker->>ESP32: Entrega mensagem de comando
    ESP32->>Actuator: Aciona pino GPIO 14 (HIGH)
    ESP32->>Broker: PUBLISH "v1/devices/esp32-temp-01/commands/ack" (Payload: {"commandId":"cmd-123","success":true,"state":true}, QoS 1)
    Broker->>Gateway: Entrega mensagem de ACK
    Gateway->>Gateway: Resolve Promise pendente para "cmd-123"
    Gateway-->>React: Responde HTTP 200 OK ({"success":true, "actuatorState":true})
    React->>User: Exibe mensagem "✅ Comando confirmado com sucesso pelo ESP32 (ACK)!"
```

---

## 3. Schemas de Mensagens JSON

### 3.1 Telemetria (`v1/devices/{deviceId}/telemetry`)
```json
{
  "temp": 32.5,
  "humidity": 35.0,
  "noiseLevel": 78,
  "alerts": [
    "HIGH_TEMP",
    "HIGH_NOISE"
  ],
  "lcdText": "ALERTA: Temp >30C! Beba agua & ar em circulacao",
  "displayType": "ST7789_SPI",
  "actuatorState": true,
  "timestamp": 1723500000
}
```

### 3.2 Status Online (`v1/devices/{deviceId}/status`)
```json
{
  "status": "online",
  "ip": "192.168.1.105",
  "firmwareVersion": "1.0.0-js",
  "runtime": "Espruino JS",
  "timestamp": 1723500000
}
```

### 3.3 Status Offline LWT (`v1/devices/{deviceId}/status`)
```json
{
  "status": "offline",
  "reason": "unexpected_disconnect",
  "timestamp": 1723500000
}
```

### 3.4 Envio de Comando (`v1/devices/{deviceId}/commands`)
```json
{
  "commandId": "cmd-8f92a1",
  "action": "SET_ACTUATOR",
  "state": true
}
```

### 3.5 Confirmação ACK (`v1/devices/{deviceId}/commands/ack`)
```json
{
  "commandId": "cmd-8f92a1",
  "success": true,
  "state": true,
  "timestamp": 1723500005
}
```
