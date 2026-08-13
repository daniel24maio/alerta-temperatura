import { z } from 'zod';

export const telemetrySchema = z.object({
  temp: z.number(),
  humidity: z.number(),
  noiseLevel: z.number().default(45),
  alerts: z.array(z.string()).default([]),
  lcdText: z.string().optional(),
  displayType: z.string().optional(),
  actuatorState: z.boolean().default(false),
  timestamp: z.number().optional(),
});

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
  action: z.literal('SET_ACTUATOR'),
  state: z.boolean(),
});

export type CommandRequest = z.infer<typeof commandRequestSchema>;

export const ackSchema = z.object({
  commandId: z.string(),
  success: z.boolean(),
  state: z.boolean(),
  timestamp: z.number().optional(),
});

export type ACKPayload = z.infer<typeof ackSchema>;
