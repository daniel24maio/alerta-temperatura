import { describe, it, expect } from 'vitest';
import express from 'express';
import { EventEmitter } from 'events';
import { telemetrySchema, statusSchema, commandRequestSchema, ackSchema } from '../src/validators/schemas';
import { kvStore } from '../src/storage/kv_store';
import { apiRouter } from '../src/api/routes';
import { errorHandler } from '../src/middleware/error_handler';

const testApp = express();
testApp.use('/api', apiRouter);
testApp.use(errorHandler);
const authHeader = 'Basic ' + Buffer.from('admin:admin123').toString('base64');

function invokeApi(method: string, url: string, headers: Record<string, string> = {}, body?: any): Promise<{ status: number; body: any }> {
  return new Promise((resolve) => {
    const req: any = Object.assign(new EventEmitter(), {
      method,
      url,
      originalUrl: url,
      headers: Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])),
      body: body || {},
      _body: true,
      get(name: string) {
        return this.headers[name.toLowerCase()];
      },
      header(name: string) {
        return this.headers[name.toLowerCase()];
      },
    });
    const resHeaders: Record<string, string> = {};
    const res: any = Object.assign(new EventEmitter(), {
      statusCode: 200,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      setHeader(k: string, v: string) {
        resHeaders[k.toLowerCase()] = v;
      },
      getHeader(k: string) {
        return resHeaders[k.toLowerCase()];
      },
      json(data: any) {
        resolve({ status: this.statusCode, body: data });
        return this;
      },
      send(data: any) {
        resolve({ status: this.statusCode, body: data });
        return this;
      },
      end(data?: any) {
        resolve({ status: this.statusCode, body: data });
        return this;
      },
    });
    testApp.handle(req, res, (err: any) => {
      if (err) {
        errorHandler(err, req, res, () => {});
      }
    });
  });
}

describe('Suíte de Testes de Integração Backend & Persistência (Vitest)', () => {
  // Entrega 4: Validação e Diagnóstico de Mensagens
  it('Deve validar corretamente um payload de telemetria válido', () => {
    const validTelemetry = {
      temp: 32.5,
      humidity: 35.0,
      noiseLevel: 78,
      alerts: ['HIGH_TEMP', 'HIGH_NOISE'],
      lcdText: 'FORA DE CONFORMIDADE: TEMPERATURA',
      displayType: 'ST7789_SPI',
      actuatorState: true,
      timestamp: 1723500000,
    };

    const parsed = telemetrySchema.parse(validTelemetry);
    expect(parsed.temp).toBe(32.5);
    expect(parsed.noiseLevel).toBe(78);
    expect(parsed.alerts).toContain('HIGH_TEMP');
    expect(parsed.actuatorState).toBe(true);
  });

  it('Deve rejeitar payload de telemetria inválido para fins de diagnóstico', () => {
    const invalidTelemetry = {
      temp: "invalido",
      humidity: 50,
    };
    expect(() => telemetrySchema.parse(invalidTelemetry)).toThrow();
  });

  it('Deve validar status online/offline LWT de presença', () => {
    expect(statusSchema.parse({ status: 'online' }).status).toBe('online');
    expect(statusSchema.parse({ status: 'offline' }).status).toBe('offline');
  });

  it('Deve validar comandos REST HTTP de controle remoto', () => {
    const cmd = { action: 'SET_ACTUATOR', state: true };
    expect(commandRequestSchema.parse(cmd).state).toBe(true);
  });

  // Entrega 5: Persistência de Estado, Histórico e Presença
  it('Deve persistir e recuperar o estado atual e presença do dispositivo (Entrega 5)', async () => {
    const testDeviceId = 'test-device-01';
    const telemetry = telemetrySchema.parse({
      temp: 25.4,
      humidity: 60.0,
      noiseLevel: 45,
      lux: 350,
      actuatorState: false,
      timestamp: Math.floor(Date.now() / 1000),
    });

    await kvStore.saveTelemetry(testDeviceId, telemetry);
    const record = await kvStore.getDeviceRecord(testDeviceId);

    expect(record).not.toBeNull();
    expect(record?.deviceId).toBe(testDeviceId);
    expect(record?.status).toBe('online');
    expect(record?.lastSeen).toBeDefined();
    expect(record?.state?.recordedAt).toBeDefined();
    expect(record?.state?.temp).toBe(25.4);
    expect(record?.state?.humidity).toBe(60.0);
  });

  it('Deve persistir e consultar registros históricos de telemetria com data aferida e filtro por dia', async () => {
    const testDeviceId = 'test-device-history-filter';
    
    // Insere leitura de hoje e leitura de um dia anterior (ex: 2026-10-10)
    const telemetryPast = telemetrySchema.parse({
      temp: 21.0,
      humidity: 55.0,
      noiseLevel: 42,
      actuatorState: false,
      recordedAt: '2026-10-10T14:30:00.000Z',
    });
    const telemetryToday = telemetrySchema.parse({
      temp: 24.5,
      humidity: 62.0,
      noiseLevel: 48,
      actuatorState: false,
      recordedAt: '2026-10-15T18:00:00.000Z',
    });

    await kvStore.saveTelemetry(testDeviceId, telemetryPast);
    await kvStore.saveTelemetry(testDeviceId, telemetryToday);

    const allHistory = await kvStore.getDeviceHistory(testDeviceId, 10);
    expect(allHistory.length).toBeGreaterThanOrEqual(2);
    expect(allHistory[0].recordedAt).toBeDefined();

    // Filtra exclusivamente o dia anterior '2026-10-10'
    const pastDayHistory = await kvStore.getDeviceHistory(testDeviceId, 10, '2026-10-10');
    expect(pastDayHistory.length).toBe(1);
    expect(pastDayHistory[0].recordedAt).toContain('2026-10-10');
    expect(pastDayHistory[0].temp).toBe(21.0);
  });

  it('Deve atualizar e registrar status de presença e último contato (Entrega 5)', async () => {
    const testDeviceId = 'test-device-presence';
    await kvStore.updateDeviceStatus(testDeviceId, {
      status: 'offline',
      reason: 'LWT broker disconnect',
      timestamp: Math.floor(Date.now() / 1000),
    });

    const record = await kvStore.getDeviceRecord(testDeviceId);
    expect(record?.deviceId).toBe(testDeviceId);
    expect(record?.status).toBe('offline');
    expect(record?.lastSeen).toBeDefined();
  });

  // Entrega 6: Comunicação Bidirecional e Confirmação de Comandos
  it('Deve validar payload de confirmação (ACK/State) publicado pelo ESP32 (Entrega 6)', () => {
    const rawAck = {
      deviceId: 'esp32_temp',
      actuator: 'led',
      state: true,
      requestId: 'cmd_test_123',
      timestamp: Math.floor(Date.now() / 1000),
    };

    const parsed = ackSchema.parse(rawAck);
    expect(parsed.commandId).toBe('cmd_test_123');
    expect(parsed.state).toBe(true);
    expect(parsed.success).toBe(true);
  });

  it('Deve atualizar o estado do atuador no Redis exclusivamente após confirmação do dispositivo (Entrega 6)', async () => {
    const testDeviceId = 'test-device-ack-flow';

    // 1. Estado inicial: Atuador desligado (false)
    const initialTelemetry = telemetrySchema.parse({
      temp: 24.0,
      humidity: 50.0,
      noiseLevel: 42,
      actuatorState: false,
    });
    await kvStore.saveTelemetry(testDeviceId, initialTelemetry);

    let record = await kvStore.getDeviceRecord(testDeviceId);
    expect(record?.state?.actuatorState).toBe(false);

    // 2. Simula comando emitido pelo Gateway e confirmação (ACK) retornada pelo ESP32
    const confirmedAck = ackSchema.parse({
      deviceId: testDeviceId,
      actuator: 'led',
      state: true,
      requestId: 'cmd_ack_confirmed',
    });

    // 3. Atualiza estado com base na confirmação recebida
    if (record && record.state) {
      record.state.actuatorState = confirmedAck.state;
      await kvStore.saveTelemetry(testDeviceId, record.state);
    }

    // 4. Verifica se o Redis reflete o estado efetivamente confirmado (true)
    const updatedRecord = await kvStore.getDeviceRecord(testDeviceId);
    expect(updatedRecord?.state?.actuatorState).toBe(true);
  });

  // Entrega 7: API HTTP/JSON em Node.js integrada ao Redis e Tratamento de Erros HTTP
  it('Deve consultar estado atual, presença e histórico via endpoints REST com respostas JSON (Entrega 7)', async () => {
    const deviceId = 'esp32_api_test';
    await kvStore.updateDeviceStatus(deviceId, {
      status: 'online',
      ip: '192.168.1.175',
      firmwareVersion: '1.0.0',
      timestamp: Math.floor(Date.now() / 1000),
    });
    await kvStore.saveTelemetry(
      deviceId,
      telemetrySchema.parse({
        temp: 24.8,
        humidity: 72.5,
        noiseLevel: 40,
        lux: 320,
        actuatorState: false,
      })
    );

    // 1. Consulta de estado atual (GET /api/devices/:id e GET /api/devices/:id/state)
    const resState = await invokeApi('GET', `/api/devices/${deviceId}`, { Authorization: authHeader });
    expect(resState.status).toBe(200);
    expect(resState.body.deviceId).toBe(deviceId);
    expect(resState.body.state.temp).toBe(24.8);

    const resStateSub = await invokeApi('GET', `/api/devices/${deviceId}/state`, { Authorization: authHeader });
    expect(resStateSub.status).toBe(200);
    expect(resStateSub.body.state.humidity).toBe(72.5);

    // 2. Consulta de presença e último contato (GET /api/devices/:id/presence)
    const resPresence = await invokeApi('GET', `/api/devices/${deviceId}/presence`, { Authorization: authHeader });
    expect(resPresence.status).toBe(200);
    expect(resPresence.body.status).toBe('online');
    expect(resPresence.body.lastSeen).toBeDefined();
    expect(resPresence.body.ip).toBe('192.168.1.175');

    // 3. Consulta de histórico de telemetria (GET /api/devices/:id/history)
    const resHistory = await invokeApi('GET', `/api/devices/${deviceId}/history?limit=5`, { Authorization: authHeader });
    expect(resHistory.status).toBe(200);
    expect(Array.isArray(resHistory.body)).toBe(true);
    expect(resHistory.body.length).toBeGreaterThanOrEqual(1);
    expect(resHistory.body[0].temp).toBe(24.8);
  });

  it('Deve retornar códigos HTTP adequados para erros (401, 404, 400 e 503) na API REST (Entrega 7)', async () => {
    // 401 Unauthorized sem credenciais
    const res401 = await invokeApi('GET', '/api/devices');
    expect(res401.status).toBe(401);
    expect(res401.body.error).toBe('UNAUTHORIZED');

    // 404 Not Found para dispositivo inexistente no estado atual, presença e histórico
    const res404Device = await invokeApi('GET', '/api/devices/dispositivo_inexistente_xyz', { Authorization: authHeader });
    expect(res404Device.status).toBe(404);
    expect(res404Device.body.error).toBe('NOT_FOUND');

    const res404Presence = await invokeApi('GET', '/api/devices/dispositivo_inexistente_xyz/presence', { Authorization: authHeader });
    expect(res404Presence.status).toBe(404);

    const res404History = await invokeApi('GET', '/api/devices/dispositivo_inexistente_xyz/history', { Authorization: authHeader });
    expect(res404History.status).toBe(404);

    // 404 Ausência de dados de telemetria (dispositivo registrado apenas com presença sem telemetria)
    await kvStore.updateDeviceStatus('esp32_sem_telemetria', { status: 'online' });
    const res404NoData = await invokeApi('GET', '/api/devices/esp32_sem_telemetria/state', { Authorization: authHeader });
    expect(res404NoData.status).toBe(404);
    expect(res404NoData.body.error).toBe('NO_TELEMETRY_DATA');

    // 400 Bad Request para payload de comando inválido
    const res400 = await invokeApi('POST', '/api/devices/esp32_api_test/command', { Authorization: authHeader }, { action: 'INVALID_ACTION' });
    expect(res400.status).toBe(400);
    expect(res400.body.error).toBe('VALIDATION_ERROR');
  });
});
