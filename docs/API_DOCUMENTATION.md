# Documentação da API HTTP/JSON REST & Autenticação Básica

O Gateway disponibiliza uma API REST HTTP/JSON protegida por **Autenticação Básica (HTTP Basic Auth)**.

---

## 1. Autenticação

Para acessar qualquer rota protegida, inclua o cabeçalho HTTP:
```http
Authorization: Basic <base64(API_USER:API_PASS)>
```
As credenciais padrão são configuradas via variáveis de ambiente (`API_USER` e `API_PASS`).

---

## 2. Endpoints da API REST

### 2.1 Health Check (Público)
- **URL**: `GET /api/health`
- **Autenticação**: Nenhuma
- **Resposta (200 OK)**:
```json
{
  "status": "ok",
  "uptime": 12450,
  "mqttConnected": true,
  "storageType": "redis"
}
```

### 2.2 Listar Dispositivos Registrados
- **URL**: `GET /api/devices`
- **Autenticação**: HTTP Basic Auth
- **Resposta (200 OK)**:
```json
[
  {
    "deviceId": "esp32-temp-01",
    "status": "online",
    "lastSeen": "2026-08-13T22:30:00.000Z",
    "lastTelemetry": {
      "temp": 32.5,
      "humidity": 35.0,
      "noiseLevel": 78,
      "alerts": ["HIGH_TEMP", "HIGH_NOISE"],
      "actuatorState": true
    }
  }
]
```

### 2.3 Obter Estado Atual de um Dispositivo
- **URL**: `GET /api/devices/:id`
- **Autenticação**: HTTP Basic Auth
- **Resposta (200 OK)**:
```json
{
  "deviceId": "esp32-temp-01",
  "status": "online",
  "lastSeen": "2026-08-13T22:30:00.000Z",
  "state": {
    "temp": 32.5,
    "humidity": 35.0,
    "noiseLevel": 78,
    "alerts": ["HIGH_TEMP", "HIGH_NOISE"],
    "lcdText": "ALERTA: Temp >30C! Beba agua & ar em circulacao",
    "actuatorState": true
  }
}
```

### 2.4 Obter Histórico de Telemetria
- **URL**: `GET /api/devices/:id/history`
- **Autenticação**: HTTP Basic Auth
- **Resposta (200 OK)**:
```json
[
  {
    "temp": 32.5,
    "humidity": 35.0,
    "noiseLevel": 78,
    "alerts": ["HIGH_TEMP", "HIGH_NOISE"],
    "timestamp": 1723500000
  }
]
```

### 2.5 Enviar Comando Remoto ao Atuador
- **URL**: `POST /api/devices/:id/command`
- **Autenticação**: HTTP Basic Auth
- **Body JSON**:
```json
{
  "action": "SET_ACTUATOR",
  "state": true
}
```
- **Resposta de Sucesso (200 OK)**:
```json
{
  "success": true,
  "commandId": "cmd-18a7f4",
  "deviceId": "esp32-temp-01",
  "actuatorState": true,
  "acknowledgedAt": "2026-08-13T22:30:05.000Z"
}
```
- **Resposta de Timeout / Falha (504 Gateway Timeout)**:
```json
{
  "error": "ACTUATOR_ACK_TIMEOUT",
  "message": "O dispositivo não respondeu com a confirmação (ACK) dentro do limite de 5 segundos."
}
```
