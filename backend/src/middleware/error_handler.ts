import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('[Error Handler]', err?.message || String(err));

  if (err instanceof ZodError || err?.name === 'ZodError') {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Dados ou parâmetros da requisição inválidos.',
      details: err.errors || err.issues,
      timestamp: new Date().toISOString(),
    });
  }

  if (err?.message && err.message.startsWith('MQTT_DISCONNECTED')) {
    return res.status(503).json({
      error: 'SERVICE_UNAVAILABLE',
      message: 'Serviço de mensageria MQTT temporariamente indisponível.',
      timestamp: new Date().toISOString(),
    });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Erro interno no servidor Gateway.';

  return res.status(status).json({
    error: err.name || 'INTERNAL_SERVER_ERROR',
    message,
    timestamp: new Date().toISOString(),
  });
}
