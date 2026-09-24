# Pasta de Evidências — Etapa 1
**Disciplina**: Internet das Coisas III — IFMG Campus Ouro Branco  
**Professor**: Charles Tim Batista Garrocho  

Conforme a **Seção 4.3 e 16.1** da Apostila Prática da Etapa 1, esta pasta deve conter as capturas de tela comprovando o funcionamento do dispositivo em bancada:

## 📸 Arquivos Necessários:

1. **`wifi_conectado.png`**:
   - Captura do Monitor Serial (Arduino IDE ou PlatformIO) exibindo a inicialização, conexão Wi-Fi com sucesso, IP obtido, Gateway e RSSI (sinal em dBm).

2. **`mqtt_publicacao.png`**:
   - Captura do cliente MQTT de desktop (ex: **MQTT Explorer**) exibindo:
     - Tópico de disponibilidade `ifmg/iot3/<turma>/<aluno>/<dispositivo>/availability` com valor `"online"` (retained: true).
     - Tópico de telemetria `ifmg/iot3/<turma>/<aluno>/<dispositivo>/telemetry` recebendo mensagens JSON periódicas com sequência e uptime.

3. **`mqtt_comando.png`**:
   - Captura do envio de um comando válido pelo cliente MQTT no tópico `.../command`:
     ```json
     {
       "action": "set",
       "target": "led",
       "value": true,
       "requestId": "demo-001"
     }
     ```
   - E a resposta imediata de confirmação do ESP32 no tópico `.../state`:
     ```json
     {
       "deviceId": "esp32_temp",
       "actuator": "led",
       "state": true,
       "requestId": "demo-001"
     }
     ```
