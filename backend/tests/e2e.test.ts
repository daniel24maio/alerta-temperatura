import { describe, it, expect } from 'vitest';
import { telemetrySchema, statusSchema, commandRequestSchema, ackSchema } from '../src/validators/schemas';

describe('Suíte de Testes de Integração Backend (Vitest)', () => {
  it('Deve validar corretamente um payload de telemetria válido', () => {
    const validTelemetry = {
      temp: 32.5,
      humidity: 35.0,
      noiseLevel: 78,
      alerts: ['HIGH_TEMP', 'HIGH_NOISE'],
      lcdText: 'ALERTA: Temp >30C! Beba agua & ar em circulacao',
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

  it('Deve rejeitar payload de telemetria inválido', () => {
    const invalidTelemetry = {
      temp: "invalido",
      humidity: 50,
    };
    expect(() => telemetrySchema.parse(invalidTelemetry)).toThrow();
  });

  it('Deve validar status online/offline LWT', () => {
    expect(statusSchema.parse({ status: 'online' }).status).toBe('online');
    expect(statusSchema.parse({ status: 'offline' }).status).toBe('offline');
  });

  it('Deve validar comandos REST HTTP', () => {
    const cmd = { action: 'SET_ACTUATOR', state: true };
    expect(commandRequestSchema.parse(cmd).state).toBe(true);
  });
});
