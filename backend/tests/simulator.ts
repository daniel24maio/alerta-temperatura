import mqtt from 'mqtt';

const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const DEVICE_ID = 'esp32-temp-01';

console.log(`[Simulador ESP32] Conectando ao broker: ${BROKER_URL}...`);

const lwtPayload = JSON.stringify({
  status: 'offline',
  reason: 'unexpected_disconnect',
  timestamp: Math.floor(Date.now() / 1000),
});

const client = mqtt.connect(BROKER_URL, {
  clientId: DEVICE_ID,
  will: {
    topic: `v1/devices/${DEVICE_ID}/status`,
    payload: Buffer.from(lwtPayload),
    qos: 1,
    retain: true,
  },
});

let actuatorState = false;
let currentTemp = 26.5;
let currentHumidity = 55.0;
let currentNoise = 48;

client.on('connect', () => {
  console.log(`[Simulador ESP32] Conectado ao Broker! Dispositivo: ${DEVICE_ID}`);

  const onlinePayload = JSON.stringify({
    status: 'online',
    ip: '192.168.1.105',
    firmwareVersion: '1.0.0-sim',
    uptime: 120,
    timestamp: Math.floor(Date.now() / 1000),
  });
  client.publish(`v1/devices/${DEVICE_ID}/status`, onlinePayload, { qos: 1, retain: true });

  client.subscribe(`v1/devices/${DEVICE_ID}/commands`, { qos: 1 }, (err) => {
    if (!err) {
      console.log(`[Simulador ESP32] Inscrito em: v1/devices/${DEVICE_ID}/commands`);
    }
  });

  setInterval(() => {
    sendTelemetry();
  }, 4000);
});

client.on('message', (topic, message) => {
  try {
    const cmd = JSON.parse(message.toString());
    console.log(`\n[Simulador ESP32] ⚡ Comando Recebido: ID=${cmd.commandId} Action=${cmd.action} State=${cmd.state}`);

    if (cmd.action === 'SET_ACTUATOR') {
      actuatorState = cmd.state;

      const ackPayload = JSON.stringify({
        commandId: cmd.commandId,
        success: true,
        state: actuatorState,
        timestamp: Math.floor(Date.now() / 1000),
      });

      client.publish(`v1/devices/${DEVICE_ID}/commands/ack`, ackPayload, { qos: 1 });
      console.log(`[Simulador ESP32] ✅ ACK Publicado! Atuador: ${actuatorState ? 'LIGADO' : 'DESLIGADO'}\n`);
      
      sendTelemetry();
    }
  } catch (err) {
    console.error('[Simulador ESP32] Erro no comando:', err);
  }
});

function sendTelemetry() {
  currentTemp += (Math.random() - 0.48) * 0.5;
  currentHumidity += (Math.random() - 0.5) * 0.8;

  let alertCode = 'NONE';
  let lcdText = 'Ambiente OK - Condicoes ideais';

  if (currentTemp > 30.0 && currentHumidity < 40.0) {
    alertCode = 'CRITICAL_HEAT_DRY';
    lcdText = 'CRITICO: Temp/Umid! Hidratar & ativ. baixa intens.';
    actuatorState = true;
  } else if (currentTemp > 30.0) {
    alertCode = 'HIGH_TEMP';
    lcdText = 'ALERTA: Temp >30C! Beba agua & ar em circulacao';
    actuatorState = true;
  } else if (currentTemp >= 18.0 && currentTemp <= 30.0 && currentHumidity < 40.0) {
    alertCode = 'LOW_HUMIDITY_MILD';
    lcdText = 'ALERTA: Baixa umid! Hidrate-se / Evite ex. intenso';
  } else if (currentNoise > 75) {
    alertCode = 'HIGH_NOISE';
    lcdText = 'ALERTA: Ruido alto! Favor manter silencio no local';
    actuatorState = true;
  }

  const payload = JSON.stringify({
    temp: parseFloat(currentTemp.toFixed(1)),
    humidity: parseFloat(currentHumidity.toFixed(1)),
    noiseLevel: currentNoise,
    alerts: alertCode !== 'NONE' ? [alertCode] : [],
    lcdText,
    displayType: 'ST7789_SPI',
    actuatorState,
    timestamp: Math.floor(Date.now() / 1000),
  });

  client.publish(`v1/devices/${DEVICE_ID}/telemetry`, payload, { qos: 1 });
  console.log(`[Simulador Telemetria] T: ${currentTemp.toFixed(1)}°C | U: ${currentHumidity.toFixed(1)}% | Som: ${currentNoise}dB | Tela: "${lcdText}"`);
}
