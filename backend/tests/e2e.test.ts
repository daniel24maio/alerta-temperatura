import { describe, it, expect } from 'vitest';
import { telemetrySchema, statusSchema, commandRequestSchema, ackSchema } from '../src/validators/schemas';
import { kvStore } from '../src/storage/kv_store';

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
});
