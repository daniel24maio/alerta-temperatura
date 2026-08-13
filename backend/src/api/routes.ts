import { Router, Request, Response, NextFunction } from 'express';
import { kvStore } from '../storage/kv_store';
import { gatewayMQTT } from '../mqtt/gateway_mqtt';
import { commandRequestSchema } from '../validators/schemas';
import { basicAuth } from '../middleware/auth';

export const apiRouter = Router();

apiRouter.get('/health', async (req: Request, res: Response) => {
  return res.json({
    status: 'ok',
    uptime: process.uptime(),
    mqttConnected: gatewayMQTT.isConnected,
    storageType: kvStore.isUsingRedis ? 'redis' : 'memory_fallback',
    timestamp: new Date().toISOString(),
  });
});

apiRouter.use(basicAuth);

apiRouter.get('/devices', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const devices = await kvStore.getAllDevices();
    return res.json(devices);
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/devices/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deviceId = req.params.id;
    const record = await kvStore.getDeviceRecord(deviceId);

    if (!record) {
      return res.status(404).json({ error: 'NOT_FOUND', message: `Dispositivo '${deviceId}' não encontrado.` });
    }

    return res.json(record);
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/devices/:id/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deviceId = req.params.id;
    const history = await kvStore.getDeviceHistory(deviceId, 50);
    return res.json(history);
  } catch (err) {
    next(err);
  }
});

apiRouter.post('/devices/:id/command', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deviceId = req.params.id;
    const body = commandRequestSchema.parse(req.body);

    const ackResult = await gatewayMQTT.sendCommand(deviceId, body.action, body.state, 5000);

    const record = await kvStore.getDeviceRecord(deviceId);
    if (record && record.state) {
      record.state.actuatorState = body.state;
      await kvStore.saveTelemetry(deviceId, record.state);
    }

    return res.json({
      success: true,
      commandId: ackResult.commandId,
      deviceId,
      actuatorState: ackResult.state,
      acknowledgedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    if (err.message && err.message.startsWith('ACTUATOR_ACK_TIMEOUT')) {
      return res.status(504).json({
        error: 'ACTUATOR_ACK_TIMEOUT',
        message: 'O dispositivo não respondeu com a confirmação (ACK) dentro do limite de 5 segundos.',
      });
    }
    next(err);
  }
});
