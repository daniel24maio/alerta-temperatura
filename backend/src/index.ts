import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { apiRouter } from './api/routes';
import { errorHandler } from './middleware/error_handler';
import { gatewayMQTT } from './mqtt/gateway_mqtt';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', apiRouter);
app.use(errorHandler);

gatewayMQTT.connect();

app.listen(env.PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Backend IoT Gateway Rodando na Porta: ${env.PORT}`);
  console.log(`📡 API REST HTTP: http://localhost:${env.PORT}/api`);
  console.log(`=======================================================`);
});
