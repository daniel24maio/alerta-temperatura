import mqtt, { MqttClient } from 'mqtt';
import { env } from '../config/env';
import { telemetrySchema, statusSchema, ackSchema } from '../validators/schemas';
import { kvStore } from '../storage/kv_store';

interface PendingCommand {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timeoutTimer: NodeJS.Timeout;
}

class GatewayMQTTService {
  private client: MqttClient | null = null;
  private pendingCommands: Map<string, PendingCommand> = new Map();
  public isConnected = false;

  connect(): void {
    console.log(`[MQTT Gateway] Conectando ao Broker: ${env.MQTT_BROKER_URL}...`);
    
    this.client = mqtt.connect(env.MQTT_BROKER_URL, {
      clientId: `backend_gateway_${Math.random().toString(16).substring(2, 8)}`,
      clean: true,
      reconnectPeriod: 3000,
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      console.log('[MQTT Gateway] Conectado ao Broker MQTT com sucesso!');

      const topics = [
        'v1/devices/+/telemetry',
        'v1/devices/+/status',
        'v1/devices/+/commands/ack',
        'ifmg/iot3/+/+/+/telemetry',
        'ifmg/iot3/+/+/+/availability',
        'ifmg/iot3/+/+/+/state',
      ];

      this.client?.subscribe(topics, { qos: 1 }, (err) => {
        if (err) {
          console.error('[MQTT Gateway] Erro ao assinar tópicos:', err);
        } else {
          console.log('[MQTT Gateway] Assinado nos tópicos:', topics.join(', '));
        }
      });
    });

    this.client.on('message', (topic, payload) => {
      this.handleIncomingMessage(topic, payload.toString());
    });

    this.client.on('offline', () => {
      this.isConnected = false;
      console.warn('[MQTT Gateway] Offline do Broker MQTT.');
    });

    this.client.on('error', (err) => {
      console.error('[MQTT Gateway] Erro MQTT:', err);
    });
  }

  private async handleIncomingMessage(topic: string, messageStr: string): Promise<void> {
    try {
      let deviceId = '';
      let subtopic = '';

      if (topic.startsWith('ifmg/iot3/')) {
        const parts = topic.split('/');
        if (parts.length >= 6) {
          // ifmg/iot3/<turma>/<aluno>/<dispositivo>/<subtopic>
          deviceId = parts[4];
          subtopic = parts[5];
        }
      } else if (topic.startsWith('v1/devices/')) {
        const parts = topic.split('/');
        if (parts.length >= 4) {
          deviceId = parts[2];
          subtopic = parts.slice(3).join('/');
        }
      }

      if (!deviceId || !subtopic) return;

      if (subtopic === 'telemetry') {
        const rawJson = JSON.parse(messageStr);
        const parsed = telemetrySchema.parse(rawJson);
        await kvStore.saveTelemetry(deviceId, parsed);
        const luxStr = parsed.lux !== undefined ? ` | Lux: ${parsed.lux} lx` : '';
        const seqStr = parsed.sequence !== undefined ? ` | Seq: #${parsed.sequence}` : '';
        console.log(`[MQTT Telemetria] [${deviceId}] Temp: ${parsed.temp}°C | Umid: ${parsed.humidity}% | Ruído: ${parsed.noiseLevel}dB${luxStr}${seqStr}`);
      } else if (subtopic === 'status' || subtopic === 'availability') {
        let statusVal: 'online' | 'offline' = 'online';
        const trimmed = messageStr.trim();
        if (trimmed === 'online' || trimmed === 'offline') {
          statusVal = trimmed;
          await kvStore.updateDeviceStatus(deviceId, { status: statusVal, timestamp: Date.now() / 1000 });
        } else {
          const rawJson = JSON.parse(messageStr);
          const parsed = statusSchema.parse(rawJson);
          await kvStore.updateDeviceStatus(deviceId, parsed);
          statusVal = parsed.status;
        }
        console.log(`[MQTT Presença/LWT] [${deviceId}] Status: ${statusVal.toUpperCase()}`);
      } else if (subtopic === 'commands/ack' || subtopic === 'state') {
        const rawJson = JSON.parse(messageStr);
        const parsed = ackSchema.parse(rawJson);
        console.log(`[MQTT Confirmação/State] [${deviceId}] Req: ${parsed.commandId} | Estado: ${parsed.state}`);

        const pending = this.pendingCommands.get(parsed.commandId);
        if (pending) {
          clearTimeout(pending.timeoutTimer);
          this.pendingCommands.delete(parsed.commandId);
          pending.resolve(parsed);
        }
      }
    } catch (err: any) {
      console.warn(`[MQTT Gateway] Falha ao processar mensagem do tópico '${topic}':`, err.message || err);
    }
  }

  async sendCommand(deviceId: string, action: string, state: boolean, timeoutMs = 5000): Promise<any> {
    if (!this.client || !this.isConnected) {
      throw new Error('MQTT_DISCONNECTED: Cliente MQTT do Gateway desconectado.');
    }

    const commandId = `cmd_${Math.random().toString(36).substring(2, 9)}`;
    const topicIfmg = `ifmg/iot3/turmaA/daniel/${deviceId}/command`;
    const topicV1 = `v1/devices/${deviceId}/commands`;
    const payload = JSON.stringify({
      action: 'set',
      target: 'led',
      value: state,
      requestId: commandId,
      // compatibilidade legada:
      commandId,
      state,
    });

    return new Promise((resolve, reject) => {
      const timeoutTimer = setTimeout(() => {
        this.pendingCommands.delete(commandId);
        reject(new Error('ACTUATOR_ACK_TIMEOUT: O dispositivo não respondeu dentro do tempo limite.'));
      }, timeoutMs);

      this.pendingCommands.set(commandId, { resolve, reject, timeoutTimer });

      // Publica em ambos para máxima compatibilidade
      this.client?.publish(topicIfmg, payload, { qos: 1 });
      this.client?.publish(topicV1, payload, { qos: 1 }, (err) => {
        if (err) {
          clearTimeout(timeoutTimer);
          this.pendingCommands.delete(commandId);
          reject(err);
        } else {
          console.log(`[MQTT Gateway] Comando enviado para [${deviceId}] ID: ${commandId}`);
        }
      });
    });
  }
}

export const gatewayMQTT = new GatewayMQTTService();

