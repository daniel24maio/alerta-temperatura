import mqtt from 'mqtt';

const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const DEVICE_ID = 'esp32-temp-01';

console.log(`[Simulador ESP32] Conectando ao broker: ${BROKER_URL}...`);

const IFMG_TOPIC_TELEMETRY = 'ifmg/iot3/turmaA/daniel/esp32_temp/telemetry';
const IFMG_TOPIC_AVAILABILITY = 'ifmg/iot3/turmaA/daniel/esp32_temp/availability';
const IFMG_TOPIC_COMMAND = 'ifmg/iot3/turmaA/daniel/esp32_temp/command';
const IFMG_TOPIC_STATE = 'ifmg/iot3/turmaA/daniel/esp32_temp/state';

const client = mqtt.connect(BROKER_URL, {
  clientId: 'ifmg_iot3_turmaA_daniel_esp32_temp_sim',
  will: {
    topic: IFMG_TOPIC_AVAILABILITY,
    payload: Buffer.from('offline'),
    qos: 1,
    retain: true,
  },
});

let actuatorState = false;
let currentTemp = 26.5;
let currentHumidity = 55.0;
let currentNoise = 48;
let sequence = 0;

client.on('connect', () => {
  console.log(`[Simulador ESP32] Conectado ao Broker! Dispositivo: ${DEVICE_ID}`);

  // Disponibilidade padrão IFMG
  client.publish(IFMG_TOPIC_AVAILABILITY, 'online', { qos: 1, retain: true });
  // Disponibilidade legada
  const onlinePayload = JSON.stringify({
    status: 'online',
    ip: process.env.DEVICE_IP || '10.11.30.190',
    firmwareVersion: '1.0.0-sim',
    uptime: 120,
    timestamp: Math.floor(Date.now() / 1000),
  });
  client.publish(`v1/devices/${DEVICE_ID}/status`, onlinePayload, { qos: 1, retain: true });

  client.subscribe([`v1/devices/${DEVICE_ID}/commands`, IFMG_TOPIC_COMMAND], { qos: 1 }, (err) => {
    if (!err) {
      console.log(`[Simulador ESP32] Inscrito em: ${IFMG_TOPIC_COMMAND} e v1/devices/${DEVICE_ID}/commands`);
    }
  });

  setInterval(() => {
    sendTelemetry();
  }, 4000);
});

client.on('message', (topic, message) => {
  try {
    const cmd = JSON.parse(message.toString());
    const action = cmd.action;
    const targetState = cmd.value !== undefined ? cmd.value : cmd.state;
    const reqId = cmd.requestId || cmd.commandId || 'req_sim';

    console.log(`\n[Simulador ESP32] ⚡ Comando Recebido em ${topic}: ID=${reqId} Action=${action} State=${targetState}`);

    if (action === 'set' || action === 'SET_ACTUATOR') {
      actuatorState = targetState;

      // Confirmação State padrão IFMG
      const statePayload = JSON.stringify({
        deviceId: 'esp32_temp',
        actuator: cmd.target || 'led',
        state: actuatorState,
        requestId: reqId,
      });
      client.publish(IFMG_TOPIC_STATE, statePayload, { qos: 1, retain: true });

      // Confirmação legada
      const ackPayload = JSON.stringify({
        commandId: reqId,
        success: true,
        state: actuatorState,
        timestamp: Math.floor(Date.now() / 1000),
      });
      client.publish(`v1/devices/${DEVICE_ID}/commands/ack`, ackPayload, { qos: 1 });
      console.log(`[Simulador ESP32] ✅ Estado Confirmado publicado em ${IFMG_TOPIC_STATE}! Atuador: ${actuatorState ? 'LIGADO' : 'DESLIGADO'}\n`);
      
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

  sequence++;
  const payload = JSON.stringify({
    deviceId: 'esp32_temp',
    sensor: 'dht22_temperatura',
    value: parseFloat(currentTemp.toFixed(1)),
    unit: 'C',
    humidity: parseFloat(currentHumidity.toFixed(1)),
    noiseLevel: currentNoise,
    sequence,
    uptimeMs: process.uptime() * 1000,
    wifiRssi: -58,
    temp: parseFloat(currentTemp.toFixed(1)),
    alerts: alertCode !== 'NONE' ? [alertCode] : [],
    lcdText,
    displayType: 'ST7789_SPI',
    actuatorState,
    timestamp: Math.floor(Date.now() / 1000),
  });

  client.publish(IFMG_TOPIC_TELEMETRY, payload, { qos: 1 });
  client.publish(`v1/devices/${DEVICE_ID}/telemetry`, payload, { qos: 1 });
  console.log(`[Simulador Telemetria #${sequence}] T: ${currentTemp.toFixed(1)}°C | U: ${currentHumidity.toFixed(1)}% | Som: ${currentNoise}dB | Tela: "${lcdText}"`);
}

