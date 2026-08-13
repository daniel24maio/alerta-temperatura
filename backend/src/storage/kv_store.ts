import Redis from 'ioredis';
import { env } from '../config/env';
import { TelemetryPayload, StatusPayload } from '../validators/schemas';

export interface DeviceRecord {
  deviceId: string;
  status: 'online' | 'offline';
  lastSeen: string;
  ip?: string;
  firmwareVersion?: string;
  state?: TelemetryPayload;
}

class KeyValueStore {
  private redis: Redis | null = null;
  private memoryStore: Map<string, string> = new Map();
  public isUsingRedis = false;

  constructor() {
    try {
      this.redis = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        retryStrategy: () => null,
      });

      this.redis.on('connect', () => {
        this.isUsingRedis = true;
        console.log('[Storage] Conectado ao Banco Chave-Valor (Redis).');
      });

      this.redis.on('error', () => {
        this.isUsingRedis = false;
      });
    } catch {
      console.warn('[Storage] Fallback em Memória ativado (Sem Redis).');
    }
  }

  private async get(key: string): Promise<string | null> {
    if (this.isUsingRedis && this.redis) {
      try {
        return await this.redis.get(key);
      } catch {
        this.isUsingRedis = false;
      }
    }
    return this.memoryStore.get(key) || null;
  }

  private async set(key: string, value: string): Promise<void> {
    if (this.isUsingRedis && this.redis) {
      try {
        await this.redis.set(key, value);
        return;
      } catch {
        this.isUsingRedis = false;
      }
    }
    this.memoryStore.set(key, value);
  }

  private async lpush(key: string, value: string): Promise<void> {
    if (this.isUsingRedis && this.redis) {
      try {
        await this.redis.lpush(key, value);
        await this.redis.ltrim(key, 0, 99);
        return;
      } catch {
        this.isUsingRedis = false;
      }
    }

    const currentListStr = this.memoryStore.get(key);
    let list: string[] = currentListStr ? JSON.parse(currentListStr) : [];
    list.unshift(value);
    if (list.length > 100) list = list.slice(0, 100);
    this.memoryStore.set(key, JSON.stringify(list));
  }

  private async lrange(key: string, start: number, stop: number): Promise<string[]> {
    if (this.isUsingRedis && this.redis) {
      try {
        return await this.redis.lrange(key, start, stop);
      } catch {
        this.isUsingRedis = false;
      }
    }

    const currentListStr = this.memoryStore.get(key);
    if (!currentListStr) return [];
    const list: string[] = JSON.parse(currentListStr);
    const end = stop === -1 ? list.length : stop + 1;
    return list.slice(start, end);
  }

  private async smembers(key: string): Promise<string[]> {
    if (this.isUsingRedis && this.redis) {
      try {
        return await this.redis.smembers(key);
      } catch {
        this.isUsingRedis = false;
      }
    }

    const setStr = this.memoryStore.get(key);
    return setStr ? JSON.parse(setStr) : [];
  }

  private async sadd(key: string, member: string): Promise<void> {
    if (this.isUsingRedis && this.redis) {
      try {
        await this.redis.sadd(key, member);
        return;
      } catch {
        this.isUsingRedis = false;
      }
    }

    const setStr = this.memoryStore.get(key);
    const set: string[] = setStr ? JSON.parse(setStr) : [];
    if (!set.includes(member)) {
      set.push(member);
      this.memoryStore.set(key, JSON.stringify(set));
    }
  }

  async registerDevice(deviceId: string): Promise<void> {
    await this.sadd('devices:index', deviceId);
  }

  async updateDeviceStatus(deviceId: string, payload: StatusPayload): Promise<void> {
    await this.registerDevice(deviceId);
    const key = `device:${deviceId}:presence`;
    
    const existing = await this.getDeviceRecord(deviceId);
    const record: DeviceRecord = {
      deviceId,
      status: payload.status,
      lastSeen: new Date().toISOString(),
      ip: payload.ip || existing?.ip,
      firmwareVersion: payload.firmwareVersion || existing?.firmwareVersion,
      state: existing?.state,
    };

    await this.set(key, JSON.stringify(record));
  }

  async saveTelemetry(deviceId: string, payload: TelemetryPayload): Promise<void> {
    await this.registerDevice(deviceId);

    const presenceKey = `device:${deviceId}:presence`;
    const existing = await this.getDeviceRecord(deviceId);

    const record: DeviceRecord = {
      deviceId,
      status: existing?.status || 'online',
      lastSeen: new Date().toISOString(),
      ip: existing?.ip,
      firmwareVersion: existing?.firmwareVersion,
      state: payload,
    };
    await this.set(presenceKey, JSON.stringify(record));

    const historyKey = `device:${deviceId}:history`;
    await this.lpush(historyKey, JSON.stringify({
      ...payload,
      recordedAt: new Date().toISOString(),
    }));
  }

  async getDeviceRecord(deviceId: string): Promise<DeviceRecord | null> {
    const data = await this.get(`device:${deviceId}:presence`);
    return data ? JSON.parse(data) : null;
  }

  async getAllDevices(): Promise<DeviceRecord[]> {
    const deviceIds = await this.smembers('devices:index');
    const records: DeviceRecord[] = [];

    for (const id of deviceIds) {
      const record = await this.getDeviceRecord(id);
      if (record) {
        records.push(record);
      } else {
        records.push({
          deviceId: id,
          status: 'offline',
          lastSeen: new Date(0).toISOString(),
        });
      }
    }

    return records;
  }

  async getDeviceHistory(deviceId: string, limit = 50): Promise<any[]> {
    const rawList = await this.lrange(`device:${deviceId}:history`, 0, limit - 1);
    return rawList.map((item) => JSON.parse(item));
  }
}

export const kvStore = new KeyValueStore();
