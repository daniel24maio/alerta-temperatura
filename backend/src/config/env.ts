import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  MQTT_BROKER_URL: z.string().default('mqtt://localhost:1883'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  API_USER: z.string().default('admin'),
  API_PASS: z.string().default('admin123'),
  NODE_ENV: z.string().default('development'),
});

export const env = envSchema.parse(process.env);
