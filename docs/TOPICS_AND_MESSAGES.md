# Especificação de Tópicos e Contratos JSON (MQTT)

Este documento especifica a hierarquia de tópicos MQTT, qualidade de serviço (QoS), retenção, Last Will and Testament (LWT) e schemas de mensagens JSON para o projeto.

---

## 1. Hierarquia de Tópicos MQTT

Todos os tópicos seguem o padrão padronizado com versionamento `v1` e identificador dinâmico do dispositivo `{deviceId}`:

| Tópico | Direção | QoS | Retain | Descrição |
| :--- | :---: | :---: | :---: | :--- |
| `v1/devices/{deviceId}/telemetry` | ESP32 -> Gateway | **1** | `false` | Envio periódico de leituras de sensores e alertas. |
| `v1/devices/{deviceId}/status` | ESP32 -> Gateway | **1** | `true` | Registro de presença online e mensagem LWT offline. |
| `v1/devices/{deviceId}/commands` | Gateway -> ESP32 | **1** | `false` | Envio de comandos de controle do atuador. |
| `v1/devices/{deviceId}/commands/ack` | ESP32 -> Gateway | **1** | `false` | Confirmação de execução do comando recebido. |

---

## 2. Contratos de Mensagens JSON

### 2.1 Telemetria (`v1/devices/{deviceId}/telemetry`)
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

### 2.2 Presença Online & LWT (`v1/devices/{deviceId}/status`)
**Mensagem de Conexão (Online):**
```json
{
  "status": "online",
  "ip": "192.168.1.105",
  "firmwareVersion": "1.0.0",
  "uptime": 3600,
  "timestamp": 1723500000
}
```

**Mensagem LWT (Offline - Retained no Broker):**
```json
{
  "status": "offline",
  "reason": "unexpected_disconnect",
  "timestamp": 1723500000
}
```

### 2.3 Comando de Controle (`v1/devices/{deviceId}/commands`)
```json
{
  "commandId": "cmd-8f92a1",
  "action": "SET_ACTUATOR",
  "state": true
}
```

### 2.4 Confirmação de Comando ACK (`v1/devices/{deviceId}/commands/ack`)
```json
{
  "commandId": "cmd-8f92a1",
  "success": true,
  "state": true,
  "timestamp": 1723500005
}
```
