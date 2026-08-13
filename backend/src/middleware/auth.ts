import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export function basicAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="IoT Gateway Secure API"');
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Credenciais de autenticação básica não fornecidas.' });
  }

  const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString('utf-8');
  const [user, pass] = credentials.split(':');

  if (user === env.API_USER && pass === env.API_PASS) {
    return next();
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="IoT Gateway Secure API"');
  return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Usuário ou senha inválidos.' });
}
