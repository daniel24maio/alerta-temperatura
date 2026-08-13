/**
 * ESP32 JavaScript Firmware (Espruino / Node.js-style Runtime)
 * Solução IoT Alerta de Temperatura e Saúde Ambiental
 */

const WIFI_SSID = "SuaRedeWiFi";
const WIFI_PASS = "SuaSenhaWiFi";
const MQTT_HOST = "192.168.1.100";
const DEVICE_ID = "esp32-temp-01";

const TOPIC_TELEMETRY = "v1/devices/" + DEVICE_ID + "/telemetry";
const TOPIC_STATUS    = "v1/devices/" + DEVICE_ID + "/status";
const TOPIC_COMMANDS  = "v1/devices/" + DEVICE_ID + "/commands";
const TOPIC_ACK       = "v1/devices/" + DEVICE_ID + "/commands/ack";

// Pinos de hardware
const PIN_LED = D12;
const PIN_RELAY = D14;
const PIN_SOUND = D34;

let actuatorState = false;
let mqttClient = null;

function setActuator(state) {
  actuatorState = state;
  digitalWrite(PIN_RELAY, state ? 1 : 0);
  digitalWrite(PIN_LED, state ? 1 : 0);
}

// Inicialização de hardware
pinMode(PIN_LED, "output");
pinMode(PIN_RELAY, "output");
setActuator(false);

console.log("--- Inicializando ESP32 JavaScript (Espruino) ---");

// Conectividade Wi-Fi
const wifi = require("Wifi");
wifi.connect(WIFI_SSID, { password: WIFI_PASS }, function(err) {
  if (err) {
    console.log("Erro de conexão Wi-Fi: " + err);
    return;
  }
  console.log("Wi-Fi Conectado! IP: " + wifi.getIP().ip);
  setupMQTT();
});

function setupMQTT() {
  const MQTT = require("MQTT");
  
  // Mensagem LWT (Last Will and Testament) em JSON
  const lwtPayload = JSON.stringify({
    status: "offline",
    reason: "unexpected_disconnect",
    timestamp: Math.floor(Date.now() / 1000)
  });

  mqttClient = MQTT.create(MQTT_HOST, {
    client_id: DEVICE_ID,
    will_topic: TOPIC_STATUS,
    will_msg: lwtPayload,
    will_qos: 1,
    will_retain: true
  });

  mqttClient.on("connected", function() {
    console.log("MQTT Conectado ao Broker!");

    // Publica status Online
    const onlinePayload = JSON.stringify({
      status: "online",
      ip: wifi.getIP().ip,
      runtime: "Espruino JS",
      timestamp: Math.floor(Date.now() / 1000)
    });
    mqttClient.publish(TOPIC_STATUS, onlinePayload, { qos: 1, retain: true });

    // Subscreve comandos
    mqttClient.subscribe(TOPIC_COMMANDS);
  });

  mqttClient.on("message", function(pub) {
    console.log("Comando Recebido no tópico " + pub.topic + ": " + pub.message);
    try {
      const cmd = JSON.parse(pub.message);
      if (cmd.action === "SET_ACTUATOR") {
        setActuator(cmd.state);

        // Envia ACK
        const ackPayload = JSON.stringify({
          commandId: cmd.commandId,
          success: true,
          state: actuatorState,
          timestamp: Math.floor(Date.now() / 1000)
        });
        mqttClient.publish(TOPIC_ACK, ackPayload, { qos: 1 });
      }
    } catch(e) {
      console.log("Erro ao processar JSON de comando: " + e);
    }
  });

  mqttClient.connect();

  // Loop de Telemetria a cada 5 segundos
  setInterval(readAndSendTelemetry, 5000);
}

function readAndSendTelemetry() {
  // Leitura simulada/analógica de sensores
  const temp = 26.5 + (Math.random() * 8.0); // 26.5 a 34.5°C
  const humidity = 35.0 + (Math.random() * 20.0);
  const noiseRaw = analogRead(PIN_SOUND);
  const noiseDb = Math.floor(noiseRaw * 50 + 40);

  let alertCode = "NONE";
  let lcdText = "Ambiente OK - Condicoes ideais";

  if (temp > 30.0 && humidity < 40.0) {
    alertCode = "CRITICAL_HEAT_DRY";
    lcdText = "CRITICO: Temp/Umid! Hidratar & ativ. baixa intens.";
    setActuator(true);
  } else if (temp > 30.0) {
    alertCode = "HIGH_TEMP";
    lcdText = "ALERTA: Temp >30C! Beba agua & ar em circulacao";
    setActuator(true);
  } else if (temp >= 18.0 && temp <= 30.0 && humidity < 40.0) {
    alertCode = "LOW_HUMIDITY_MILD";
    lcdText = "ALERTA: Baixa umid! Hidrate-se / Evite ex. intenso";
  } else if (noiseDb > 75) {
    alertCode = "HIGH_NOISE";
    lcdText = "ALERTA: Ruido alto! Favor manter silencio no local";
    setActuator(true);
  }

  const payload = JSON.stringify({
    temp: parseFloat(temp.toFixed(1)),
    humidity: parseFloat(humidity.toFixed(1)),
    noiseLevel: noiseDb,
    alerts: alertCode !== "NONE" ? [alertCode] : [],
    lcdText: lcdText,
    displayType: "ST7789_SPI",
    actuatorState: actuatorState,
    timestamp: Math.floor(Date.now() / 1000)
  });

  if (mqttClient) {
    mqttClient.publish(TOPIC_TELEMETRY, payload, { qos: 1 });
    console.log("Telemetria JS Enviada: " + payload);
  }
}
