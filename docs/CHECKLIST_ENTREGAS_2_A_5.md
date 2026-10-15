# Relatório de Conformidade e Evidências — Entregas 2, 3, 4 e 5
**Disciplina**: Internet das Coisas III — IFMG Campus Ouro Branco  
**Professor**: Charles Tim Batista Garrocho  
**Aluno**: Daniel  
**Dispositivo**: `esp32_temp` (ESP32 DevKit V1)  
**Projeto**: Sistema de Alerta de Temperatura e Saúde Ambiental IoT  
**Data de Emissão**: Outubro / 2026  

---

## 📊 1. Resumo Executivo de Atendimento às Entregas

| Entrega | Foco Temático | Total de Produtos | ✅ Atendidos | % Conformidade |
| :--- | :--- | :---: | :---: | :---: |
| **Entrega 2** | Conectividade e Resiliência de Rede | 5 | 5 | **100%** |
| **Entrega 3** | Comunicação MQTT e Controle Remoto | 6 | 6 | **100%** |
| **Entrega 4** | Gateway MQTT e Processamento de Mensagens | 7 | 7 | **100%** |
| **Entrega 5** | Persistência de Estado, Histórico e Presença | 8 | 8 | **100%** |
| **TOTAL** | **Pipeline Completo End-to-End** | **26** | **26** | **100%** |

---

## 🌐 2. Entrega 2 — Conectividade e Resiliência de Rede

### 📋 Produtos Esperados e Comprovação

- [x] **1. ESP32 conectado à rede Wi-Fi**
  - **Arquivo**: [`firmware/src/wifi_manager.cpp`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/firmware/src/wifi_manager.cpp#L7-L22)
  - **Implementação**: Configuração em modo estação (`WiFi.mode(WIFI_STA)`), conexão via `WiFi.begin(WIFI_SSID, WIFI_PASSWORD)`. Suporte transparente a DHCP ou IP estático (`USAR_IP_ESTATICO`).

- [x] **2. Registro dos parâmetros de rede (IP, gateway, RSSI e status)**
  - **Arquivos**: [`wifi_manager.cpp:27-37`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/firmware/src/wifi_manager.cpp#L27-L37) e [`main.cpp:116`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/firmware/src/main.cpp#L116)
  - **Parâmetros Diagnosticados no Serial**:
    - **IP do ESP32**: `WiFi.localIP()` (ex: `10.11.30.204` / `10.11.30.195`)
    - **Máscara de Subrede**: `WiFi.subnetMask()` (`255.255.255.0`)
    - **Gateway Padrão**: `WiFi.gatewayIP()` (`10.11.30.141`)
    - **Status da Conexão**: `WiFi.status() == WL_CONNECTED`
    - **Intensidade do Sinal (RSSI)**: `WiFi.RSSI()`, incluído no JSON de telemetria periódica (`"wifiRssi": -48`).

- [x] **3. Código-fonte da conexão Wi-Fi**
  - **Arquivos**:
    - [`firmware/include/wifi_manager.h`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/firmware/include/wifi_manager.h)
    - [`firmware/src/wifi_manager.cpp`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/firmware/src/wifi_manager.cpp)
    - [`firmware/include/config.h`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/firmware/include/config.h)

- [x] **4. Implementação do mecanismo de reconexão**
  - **Arquivo**: [`firmware/src/wifi_manager.cpp:38-52`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/firmware/src/wifi_manager.cpp#L38-L52)
  - **Lógica**: Mecanismo não-bloqueante baseado em `millis()`. Detecta transição de status (`!currentlyConnected && wasConnected`), registra no console e realiza nova tentativa a cada 10 segundos chamando `WiFi.disconnect()` e `WiFi.begin(...)`.

- [x] **5. Evidência de funcionamento em situações de perda e recuperação**
  - **Arquivo de Evidência**: [`docs/evidencias/REGISTRO_EXECUCAO_LOCAL.md:20-38`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/docs/evidencias/REGISTRO_EXECUCAO_LOCAL.md#2-evidência-1-conexão-wi-fi-e-serial-monitor-wifi_conectadopng)
  - **Log Real**:
    ```text
    =============================================
    >>> Wi-Fi Conectado com Sucesso! <<<
    SSID Conectado: daniel
    IP do ESP32:    10.11.30.195
    Máscara Subrede:255.255.255.0
    Gateway/Router: 10.11.30.141
    Broker MQTT:    10.11.30.190:1883
    =============================================
    ```

---

## 📡 3. Entrega 3 — Comunicação MQTT e Controle Remoto

### 📋 Produtos Esperados e Comprovação

- [x] **1. Conexão do ESP32 ao broker MQTT**
  - **Arquivo**: [`firmware/src/mqtt_client.cpp:15-49`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/firmware/src/mqtt_client.cpp#L15-L49)
  - **Implementação**: Cliente `PubSubClient` com buffer expandido (512 bytes), conexão autenticada com usuário/senha e Last Will and Testament (LWT) com flag `retain = true` no tópico de disponibilidade.

- [x] **2. Plano de tópicos e estrutura das mensagens**
  - **Arquivos**: [`docs/TOPICS_AND_MESSAGES.md`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/docs/TOPICS_AND_MESSAGES.md) e [`firmware/include/config.h:46-55`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/firmware/include/config.h#L46-L55)
  - **Hierarquia Oficial IFMG (Seção 7 e 8 da Apostila)**:
    - `ifmg/iot3/turmaA/daniel/esp32_temp/telemetry` (Telemetria)
    - `ifmg/iot3/turmaA/daniel/esp32_temp/availability` (Presença LWT)
    - `ifmg/iot3/turmaA/daniel/esp32_temp/command` (Comandos recebidos)
    - `ifmg/iot3/turmaA/daniel/esp32_temp/state` (Confirmação de estado com `retained = true`)

- [x] **3. Publicação de dados de sensores (telemetria)**
  - **Arquivo**: [`firmware/src/main.cpp:105-144`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/firmware/src/main.cpp#L105-L144)
  - **Payload JSON Publicado**:
    ```json
    {
      "deviceId": "esp32_temp",
      "sensor": "dht22_temperatura",
      "value": 23.8,
      "unit": "C",
      "humidity": 74.8,
      "noiseLevel": 40,
      "lux": 250.0,
      "sequence": 1045,
      "uptimeMs": 5225000,
      "wifiRssi": -48,
      "temp": 23.8,
      "alerts": [],
      "lcdText": "AMBIENTE EM CONFORMIDADE",
      "displayType": "ST7789_SPI",
      "actuatorState": false,
      "timestamp": 5225
    }
    ```

- [x] **4. Recebimento de comandos via MQTT**
  - **Arquivo**: [`firmware/src/main.cpp:14-63`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/firmware/src/main.cpp#L14-L63)
  - **Callback `handleMqttCommand`**: Desserializa JSON recebido no tópico `.../command`. Aceita o formato oficial do IFMG (`action: "set", target: "led", value: true/false, requestId: "..."`).

- [x] **5. Acionamento do atuador por comando remoto**
  - **Arquivos**: [`main.cpp:54`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/firmware/src/main.cpp#L54) e [`actuator_manager.cpp:13-17`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/firmware/src/actuator_manager.cpp#L13-L17)
  - **Efeito Físico**: Acionamento dos pinos GPIO 12 (LED indicador) e GPIO 14 (Relé/Cooler), seguido da publicação imediata de confirmação com `retained = true` no tópico `.../state`.

- [x] **6. Evidência da comunicação bidirecional funcionando**
  - **Demonstração**: Testado via API REST (`POST /api/devices/esp32_temp/command`) com envio MQTT para o ESP32 e confirmação de retorno instantânea em menos de 100ms.
  - **Evidência Registrada**: [`docs/evidencias/REGISTRO_EXECUCAO_LOCAL.md:68-96`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/docs/evidencias/REGISTRO_EXECUCAO_LOCAL.md#4-evidência-3-acionamento-remoto-do-led--simulador-de-atuador-mqtt_comandopng).

---

## ⚙️ 4. Entrega 4 — Gateway MQTT e Processamento de Mensagens

### 📋 Produtos Esperados e Comprovação

- [x] **1. Gateway em Node.js conectado ao broker MQTT**
  - **Arquivo**: [`backend/src/mqtt/gateway_mqtt.ts:18-62`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/backend/src/mqtt/gateway_mqtt.ts#L18-L62)
  - **Configuração**: Conexão com `clean: true`, reconexão automática (`reconnectPeriod: 3000`) e listeners de eventos `connect`, `message`, `offline` e `error`.

- [x] **2. Assinatura dos tópicos definidos no projeto**
  - **Arquivo**: [`gateway_mqtt.ts:32-47`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/backend/src/mqtt/gateway_mqtt.ts#L32-L47)
  - **Tópicos Assinados (Wildcards)**:
    - `ifmg/iot3/+/+/+/telemetry`
    - `ifmg/iot3/+/+/+/availability`
    - `ifmg/iot3/+/+/+/state`
    - `v1/devices/+/telemetry`
    - `v1/devices/+/status`
    - `v1/devices/+/commands/ack`

- [x] **3. Recepção das mensagens de telemetria enviadas pelo ESP32**
  - **Arquivo**: [`gateway_mqtt.ts:86-140`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/backend/src/mqtt/gateway_mqtt.ts#L86-L140)
  - Ingestão assíncrona contínua com atualização no banco de dados e repasse para a interface web.

- [x] **4. Identificação do dispositivo responsável pela mensagem**
  - **Arquivo**: [`gateway_mqtt.ts:66-84`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/backend/src/mqtt/gateway_mqtt.ts#L66-L84)
  - **Lógica de Parsing**: Decomposição do tópico MQTT:
    - Padrão IFMG (`ifmg/iot3/<turma>/<aluno>/<dispositivo>/<subtopic>`): extrai `parts[4]` como `deviceId`.
    - Padrão REST (`v1/devices/<dispositivo>/<subtopic>`): extrai `parts[2]` como `deviceId`.

- [x] **5. Interpretação e validação das mensagens em formato JSON**
  - **Arquivos**: [`backend/src/validators/schemas.ts:3-67`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/backend/src/validators/schemas.ts#L3-L67) e [`gateway_mqtt.ts:87-88`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/backend/src/mqtt/gateway_mqtt.ts#L87-L88)
  - **Validação com Zod**: Schemas estritos para telemetria (`telemetrySchema`), presença (`statusSchema`), comandos (`commandRequestSchema`) e confirmações (`ackSchema`). Conversão e coerção de tipos com tipagem estática TypeScript.

- [x] **6. Registro de mensagens válidas e inválidas para fins de diagnóstico**
  - **Arquivos**: [`gateway_mqtt.ts:139-141`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/backend/src/mqtt/gateway_mqtt.ts#L139-L141) e [`gateway_mqtt.ts:165-167`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/backend/src/mqtt/gateway_mqtt.ts#L165-L167)
  - **Mensagens Válidas**: Log formatado no terminal com valores de temperatura, umidade, ruído, lux, sequência e conformidade.
  - **Mensagens Inválidas / Corrompidas**: Capturadas via bloco `try/catch` com log de advertência:
    ```text
    [MQTT Gateway] Falha ao processar mensagem do tópico '...': <motivo_do_erro_zod>
    ```
  - **Teste Automatizado**: Implementado em [`backend/tests/e2e.test.ts`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/backend/tests/e2e.test.ts).

- [x] **7. Evidência do gateway recebendo e processando mensagens**
  - **Suíte de Testes Vitest**: 7 testes passando com 100% de sucesso (`npm test`).
  - **Logs em Tempo Real**: Visíveis na execução do serviço backend.

---

## 🗄️ 5. Entrega 5 — Persistência de Estado, Histórico e Presença

### 📋 Produtos Esperados e Comprovação

- [x] **1. Gateway conectado ao banco de dados Redis**
  - **Arquivo**: [`backend/src/storage/kv_store.ts:20-38`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/backend/src/storage/kv_store.ts#L20-L38)
  - **Implementação**: Conexão com Redis 7 (`ioredis`) apontando para `REDIS_URL=redis://localhost:6379`. Conta com fallback inteligente em memória em caso de indisponibilidade transitória.

- [x] **2. Definição e documentação da estrutura de chaves utilizada**
  - **Modelagem das Chaves no Redis**:

| Chave Redis | Tipo de Dado | Função | Exemplo de Conteúdo |
| :--- | :---: | :--- | :--- |
| `devices:index` | **SET** | Índice com IDs de todos os dispositivos conhecidos | `["esp32_temp", "esp32-temp-01"]` |
| `device:{deviceId}:presence` | **STRING (JSON)** | Estado atual, informações de rede e último visto (`lastSeen`) | `{"deviceId":"esp32_temp","status":"online","lastSeen":"2026-10-15T22:30:00Z","state":{...}}` |
| `device:{deviceId}:history` | **LIST (JSON)** | Histórico temporal das medições anteriores com limite de 1000 itens | `[{"temp":23.8,"humidity":74,"recordedAt":"..."}, ...]` |

- [x] **3. Persistência do estado atual do dispositivo**
  - **Arquivo**: [`kv_store.ts:149-164`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/backend/src/storage/kv_store.ts#L149-L164)
  - Armazena o registro do dispositivo em `device:{deviceId}:presence` com a última telemetria recebida no atributo `state`.

- [x] **4. Persistência do histórico de telemetria**
  - **Arquivo**: [`kv_store.ts:165-170`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/backend/src/storage/kv_store.ts#L165-L170)
  - Executa `LPUSH` na chave `device:{deviceId}:history` com payload JSON acrescido do timestamp `recordedAt`. Aplica `LTRIM 0 999` para manter retention bounded (máx. 1000 amostras).

- [x] **5. Registro do último contato ou presença do dispositivo**
  - **Arquivo**: [`kv_store.ts:137-147`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/backend/src/storage/kv_store.ts#L137-L147)
  - O campo `lastSeen: new Date().toISOString()` é atualizado tanto na chegada de mensagens periódicas de telemetria quanto em eventos LWT / availability.

- [x] **6. Consulta do estado atual armazenado**
  - **Endpoints HTTP REST**:
    - `GET /api/devices` -> Lista todos os dispositivos cadastrados no índice Redis e seus estados atuais.
    - `GET /api/devices/:id` -> Retorna o estado atual completo do dispositivo pesquisado.

- [x] **7. Consulta dos registros históricos**
  - **Endpoints HTTP REST**:
    - `GET /api/devices/:id/history?limit=100` -> Retorna a série temporal ordenada (do mais recente ao mais antigo) diretamente do Redis (`LRANGE`).
    - `GET /api/devices/:id/history/export` -> Exporta os dados históricos para arquivo CSV.

- [x] **8. Evidência dos dados sendo persistidos e recuperados do Redis**
  - **Comprovação Automatizada**: Testes de unidade e integração no Vitest ([`backend/tests/e2e.test.ts`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/backend/tests/e2e.test.ts)) validando gravação e leitura direta no `kvStore`.
  - **Comprovação Manual via cURL**:
    ```bash
    curl -u admin:admin123 http://localhost:5001/api/devices/esp32_temp
    curl -u admin:admin123 http://localhost:5001/api/devices/esp32_temp/history?limit=5
    ```

---

## 🧪 6. Como Executar e Validar os Testes

Para validar localmente toda a suíte de testes que comprova o atendimento das entregas:

```bash
# 1. Acessar o diretório do backend
cd backend

# 2. Executar os testes automatizados do Vitest
npm test

# 3. Resultado Esperado:
# ✓ Suíte de Testes de Integração Backend & Persistência (Vitest) (7)
#   ✓ Deve validar corretamente um payload de telemetria válido
#   ✓ Deve rejeitar payload de telemetria inválido para fins de diagnóstico
#   ✓ Deve validar status online/offline LWT de presença
#   ✓ Deve validar comandos REST HTTP de controle remoto
#   ✓ Deve persistir e recuperar o estado atual e presença do dispositivo (Entrega 5)
#   ✓ Deve persistir e consultar registros históricos de telemetria (Entrega 5)
#   ✓ Deve atualizar e registrar status de presença e último contato (Entrega 5)
```
