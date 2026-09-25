import { z } from 'zod';

export const telemetrySchema = z.object({
  deviceId: z.string().optional(),
  sensor: z.string().optional(),
  value: z.number().optional(),
  unit: z.string().optional(),
  sequence: z.number().optional(),
  uptimeMs: z.number().optional(),
  wifiRssi: z.number().optional(),
  temp: z.number().optional(),
  humidity: z.number(),
  noiseLevel: z.number().default(45),
  lux: z.number().optional(),
  alerts: z.array(z.string()).default([]),
  lcdText: z.string().optional(),
  displayType: z.string().optional(),
  actuatorState: z.boolean().default(false),
  timestamp: z.number().optional(),
}).transform(val => ({
  ...val,
  temp: val.temp ?? val.value ?? 0,
}));

export type TelemetryPayload = z.infer<typeof telemetrySchema>;

export const statusSchema = z.object({
  status: z.enum(['online', 'offline']),
  reason: z.string().optional(),
  ip: z.string().optional(),
  firmwareVersion: z.string().optional(),
  runtime: z.string().optional(),
  uptime: z.number().optional(),
  timestamp: z.number().optional(),
});

export type StatusPayload = z.infer<typeof statusSchema>;

export const commandRequestSchema = z.object({
  action: z.enum(['set', 'SET_ACTUATOR']).default('set'),
  target: z.string().default('led'),
  state: z.boolean().optional(),
  value: z.boolean().optional(),
}).transform(val => ({
  action: val.action,
  target: val.target,
  state: val.state ?? val.value ?? false,
}));

export type CommandRequest = z.infer<typeof commandRequestSchema>;

export const ackSchema = z.object({
  deviceId: z.string().optional(),
  actuator: z.string().optional(),
  commandId: z.string().optional(),
  requestId: z.string().optional(),
  success: z.boolean().default(true),
  state: z.boolean(),
  timestamp: z.number().optional(),
}).transform(val => ({
  ...val,
  commandId: val.requestId ?? val.commandId ?? 'cmd_default',
}));

export type ACKPayload = z.infer<typeof ackSchema>;

