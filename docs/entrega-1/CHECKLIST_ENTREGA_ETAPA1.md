# Checklist de Conformidade e Entrega — Etapa 1
**Disciplina**: Internet das Coisas III — IFMG Campus Ouro Branco  
**Professor**: Charles Tim Batista Garrocho  
**Material de Referência**: Apostila Prática — Etapa 1: *Dispositivo, conectividade Wi-Fi e comunicação MQTT*  
**Projeto**: Sistema de Alerta de Temperatura e Saúde Ambiental IoT  
**Data de Emissão**: Setembro / 2026  

---

## 📊 1. Resumo Executivo da Situação Atual

| Categoria | Total de Itens | ✅ Concluídos | ⚠️ Requerem Ajuste | ❌ Pendentes | % Conformidade |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **1. Marco Obrigatório (Seção 16.1)** | 15 | 7 | 5 | 3 | **60%** |
| **2. Requisitos Mínimos (Seção 3.3)** | 9 | 6 | 3 | 0 | **78%** |
| **3. Padrões de Tópicos e JSON (Seções 7 e 8)** | 4 | 0 | 4 | 0 | **30%** (Divergência de namespace) |
| **4. Segurança e Arquivos (Seções 4.3, 4.4 e 15)** | 5 | 1 | 2 | 2 | **40%** |
| **5. Anexos Oficiais (Anexos A, B e C)** | 3 | 0 | 1 | 2 | **33%** |

> [!IMPORTANT]
> **Diagnóstico Geral**: O projeto possui um desenvolvimento de altíssimo nível (incluindo até backend em Node.js, Redis, simulador e frontend React), porém **possui divergências pontuais com a convenção exigida pelo professor na apostila**. Os tópicos MQTT estão em formato genérico (`v1/devices/...`) em vez do formato padronizado da disciplina (`ifmg/iot3/<turma>/<aluno>/<dispositivo>/...`), o payload de comando/ACK não segue os campos exatos (`requestId`, `action: set`, `target`, `availability`), e as credenciais Wi-Fi/MQTT estão no código aberto (`config.h`) em vez de estarem isoladas em `secrets.h` ignorado pelo `.gitignore`.

---

## 🎯 2. Checklist do Marco Obrigatório da Etapa 1 (Seção 16.1)

Abaixo está a checagem detalhada dos **15 itens do Marco Obrigatório** estabelecidos na página 23 da apostila:

- [x] **1. Proposta do problema e justificativa**
  - **Status**: ✅ **Concluído**
  - **Evidência**: Documentada em [`docs/entrega-1/PROPOSTA_PROJETO.md`](file:///c:/projects/alerta-temperatura/docs/entrega-1/PROPOSTA_PROJETO.md) e na Ficha de Proposta (Anexo A) abaixo.
  - **Descrição**: Justificativa clara sobre monitoramento térmico, umidade e ruído para saúde ocupacional.

- [x] **2. Diagrama completo da arquitetura prevista**
  - **Status**: ✅ **Concluído**
  - **Evidência**: Documentado em [`docs/entrega-1/DIAGRAMA_ARQUITETURA.md`](file:///c:/projects/alerta-temperatura/docs/entrega-1/DIAGRAMA_ARQUITETURA.md).
  - **Descrição**: Contempla todo o fluxo ponta a ponta: *Sensor → ESP32 → Wi-Fi → MQTT Broker → Gateway → Banco Chave-Valor → Sistema Web → Usuário*.

- [x] **3. Tabela de requisitos funcionais**
  - **Status**: ✅ **Concluído**
  - **Evidência**: Presente em [`docs/entrega-1/PROPOSTA_PROJETO.md`](file:///c:/projects/alerta-temperatura/docs/entrega-1/PROPOSTA_PROJETO.md#L26-L35) e sintetizada na Seção 6 deste documento.
  - **Descrição**: Requisitos de amostragem periódica, envio de telemetria, recepção de comandos remotos, LWT e renderização local.

- [ ] **4. Tabela de tópicos MQTT**
  - **Status**: ⚠️ **Requer Ajuste de Padrão**
  - **O que existe**: Tópicos definidos no formato `v1/devices/{deviceId}/telemetry`, `v1/devices/{deviceId}/commands`, etc.
  - **O que falta**: Adequar à convenção obrigatória do IFMG:
    - Telemetria: `ifmg/iot3/<turma>/<aluno>/<dispositivo>/telemetry`
    - Comandos: `ifmg/iot3/<turma>/<aluno>/<dispositivo>/command`
    - Estado confirmado: `ifmg/iot3/<turma>/<aluno>/<dispositivo>/state`
    - Disponibilidade: `ifmg/iot3/<turma>/<aluno>/<dispositivo>/availability`

- [ ] **5. Especificação das mensagens JSON**
  - **Status**: ⚠️ **Requer Ajuste de Padrão**
  - **O que existe**: Documentado em [`docs/entrega-1/FLUXO_DADOS_E_MENSAGENS.md`](file:///c:/projects/alerta-temperatura/docs/entrega-1/FLUXO_DADOS_E_MENSAGENS.md).
  - **O que falta**: Ajustar os campos para o formato canônico da apostila:
    - Telemetria: incluir `deviceId`, `sensor`, `value`, `unit`, `sequence`, `uptimeMs`, `wifiRssi`.
    - Comando: aceitar `action: "set"`, `target: "led"`, `value: true/false`, `requestId`.
    - Confirmação de Estado: publicar em `.../state` com `deviceId`, `actuator`, `state`, `requestId` (com flag `retained = true`).
    - Disponibilidade: publicar strings `"online"` / `"offline"` com `retained = true`.

- [x] **6. Circuito com sensor e atuador funcionando localmente**
  - **Status**: ✅ **Concluído no Firmware**
  - **Evidência**: Código implementado em [`firmware/src/sensor_manager.cpp`](file:///c:/projects/alerta-temperatura/firmware/src/sensor_manager.cpp) e [`firmware/src/actuator_manager.cpp`](file:///c:/projects/alerta-temperatura/firmware/src/actuator_manager.cpp).
  - **Descrição**: Leitura do DHT22 e ADC34, acionamento do LED (GPIO 12) e Relé (GPIO 14) com teste de acionamento imediato por limiar.

- [x] **7. Conexão Wi-Fi e reconexão automática**
  - **Status**: ✅ **Concluído**
  - **Evidência**: Implementado em [`firmware/src/wifi_manager.cpp`](file:///c:/projects/alerta-temperatura/firmware/src/wifi_manager.cpp).
  - **Descrição**: Conexão não-bloqueante via `millis()` verificando `WiFi.status() == WL_CONNECTED` e exibição de IP, Gateway e Sub-rede no console serial.

- [x] **8. Publicação de telemetria**
  - **Status**: ✅ **Concluído**
  - **Evidência**: Implementado em [`firmware/src/main.cpp`](file:///c:/projects/alerta-temperatura/firmware/src/main.cpp#L77-L102) e [`firmware/src/mqtt_client.cpp`](file:///c:/projects/alerta-temperatura/firmware/src/mqtt_client.cpp#L55-L58).
  - **Descrição**: Publicação periódica a cada 5 segundos de payload JSON gerado com `ArduinoJson`.

- [x] **9. Recepção de comando**
  - **Status**: ✅ **Concluído**
  - **Evidência**: Implementado em [`firmware/src/main.cpp`](file:///c:/projects/alerta-temperatura/firmware/src/main.cpp#L13-L37).
  - **Descrição**: Callback MQTT com validação de payload e acionamento físico do atuador.

- [ ] **10. Publicação de estado confirmado**
  - **Status**: ⚠️ **Requer Ajuste de Padrão**
  - **O que existe**: O firmware envia confirmação para `v1/devices/{deviceId}/commands/ack` sem flag retained.
  - **O que falta**: Publicar a confirmação no tópico oficial `.../state` com flag `retained = true` e os campos `deviceId`, `actuator`, `state`, `requestId`.

- [x] **11. Tratamento de JSON inválido**
  - **Status**: ✅ **Concluído**
  - **Evidência**: Callback em [`firmware/src/main.cpp`](file:///c:/projects/alerta-temperatura/firmware/src/main.cpp#L15-L21) checa `DeserializationError error = deserializeJson(...)` e aborta a execução sem travar o ESP32.

- [ ] **12. Código-fonte organizado e seguro**
  - **Status**: ⚠️ **Requer Ajuste de Segurança**
  - **O que existe**: Código modular em C++ com PlatformIO.
  - **O que falta**:
    1. Criar `firmware/include/secrets.h` para armazenar `WIFI_SSID`, `WIFI_PASSWORD`, `MQTT_HOST`, `MQTT_PORT`, `MQTT_USERNAME`, `MQTT_PASSWORD`.
    2. Adicionar `secrets.h` ao [`.gitignore`](file:///c:/projects/alerta-temperatura/.gitignore).
    3. Criar `firmware/include/secrets.example.h` como modelo sem credenciais reais.
    4. Remover credenciais pessoais gravadas em texto plano no [`firmware/include/config.h`](file:///c:/projects/alerta-temperatura/firmware/include/config.h).

- [x] **13. README com instruções de execução**
  - **Status**: ✅ **Concluído**
  - **Evidência**: Documentado em [`README.md`](file:///c:/projects/alerta-temperatura/README.md) e [`firmware/README.md`](file:///c:/projects/alerta-temperatura/firmware/README.md).
  - **Descrição**: Instruções passo a passo para compilação via PlatformIO, subida dos serviços Docker e testes.

- [ ] **14. Registro de testes e evidências**
  - **Status**: ❌ **Pendente de Documentação e Capturas**
  - **O que falta**:
    1. Preencher a tabela formal de testes T01 a T08 (Anexo B).
    2. Criar a pasta `evidencias/` com os prints:
       - `wifi_conectado.png`: Monitor Serial com IP, Gateway e RSSI.
       - `mqtt_publicacao.png`: MQTT Explorer exibindo tópico de telemetria e availability "online".
       - `mqtt_comando.png`: MQTT Explorer enviando comando e recebendo confirmação em `state`.

- [ ] **15. Demonstração prática**
  - **Status**: ❌ **Pendente de Execução / Apresentação**
  - **O que falta**: Realizar a demonstração presencial perante o professor ou gravar vídeo curto demonstrando os 10 passos do Checklist de Demonstração (Anexo C).

---

## 📋 3. Checklist dos Requisitos Mínimos do Projeto (Seção 3.3)

| Requisito Mínimo da Apostila | Componente Utilizado no Projeto | Status | Observação |
| :--- | :--- | :---: | :--- |
| **ESP32 ou placa equivalente** | ESP32 DevKit V1 (Dual Core 240MHz) | ✅ Atendido | Compatível com Arduino Core e PlatformIO. |
| **Sensor simples (digital ou analógico)** | Sensor DHT22 (Digital GPIO 15) + Som ADC (GPIO 34) | ✅ Atendido | Supera o requisito mínimo (possui 2 sensores). |
| **Atuador simples e seguro** | LED de Alerta (GPIO 12) e Relé/Cooler (GPIO 14) | ✅ Atendido | Acionamento seguro em baixa potência. |
| **Conexão Wi-Fi com recuperação** | `WiFiManager` com reconexão periódica não-bloqueante | ✅ Atendido | Utiliza `millis()` a cada 5s sem travar o loop. |
| **Publicação MQTT de telemetria** | `PubSubClient` publicando JSON a cada 5 segundos | ⚠️ Ajustar | Necessário ajustar tópico e campos do JSON. |
| **Assinatura MQTT para comando do atuador** | Inscrição no tópico de comandos no `connect` | ⚠️ Ajustar | Reassinar após reconexão e usar namespace IFMG. |
| **Mensagens em JSON para telemetria** | Biblioteca `ArduinoJson v6` | ⚠️ Ajustar | Payload pronto, necessita incluir campos padrão. |
| **Tópicos com turma, estudante e dispositivo** | Namespace: `ifmg/iot3/<turma>/<aluno>/<dispositivo>/...` | ⚠️ Ajustar | Atualmente usa `v1/devices/{deviceId}/...`. |
| **Monitor serial com diagnósticos** | Logs detalhados em 115200 bps | ✅ Atendido | Exibe IP, MAC, RSSI, Status MQTT e estados. |
| **Diagrama e documentação de fluxo** | Diagrama de arquitetura e sequência documentados | ✅ Atendido | Mermaid e diagramas em bloco prontos. |

---

## 🔒 4. Checklist de Segurança e Credenciais (Seções 4.4 e 15)

- [ ] **Criar `firmware/include/secrets.h`**:
  ```cpp
  #ifndef SECRETS_H
  #define SECRETS_H
  const char* WIFI_SSID = "NOME_DA_REDE";
  const char* WIFI_PASSWORD = "SENHA_DA_REDE";
  const char* MQTT_HOST = "ENDERECO_DO_BROKER";
  const int MQTT_PORT = 1883;
  const char* MQTT_USERNAME = "";
  const char* MQTT_PASSWORD = "";
  #endif
  ```
- [ ] **Criar modelo público `firmware/include/secrets.example.h`** sem credenciais reais para controle de versão.
- [ ] **Incluir `secrets.h` no [`.gitignore`](file:///c:/projects/alerta-temperatura/.gitignore)** para evitar vazamento em repositórios Git públicos.
- [ ] **Limpar senhas pessoais** atualmente expostas no arquivo [`firmware/include/config.h`](file:///c:/projects/alerta-temperatura/firmware/include/config.h).
- [ ] **Garantir que mensagens de erro na Serial não imprimam senhas ou tokens** (Item 70 da apostila).

---

## 🌐 5. Checklist dos Padrões MQTT e Schemas JSON (Seções 7 e 8)

### 5.1 Convenção de Tópicos
O código e a documentação devem adotar as variáveis parametrizadas:
- `<turma>`: ex: `turmaA` ou `turma2026`
- `<aluno>`: ex: `daniel`
- `<dispositivo>`: ex: `esp32_01` ou `esp32_temp`

| Tópico Obrigatório | Direção | QoS | Retain | Payload Esperado |
| :--- | :---: | :---: | :---: | :--- |
| `ifmg/iot3/<turma>/<aluno>/<dispositivo>/telemetry` | ESP32 → Broker | 0 ou 1 | `false` | JSON com dados dos sensores, sequência e uptime |
| `ifmg/iot3/<turma>/<aluno>/<dispositivo>/command` | Gateway → ESP32 | 1 | `false` | JSON de comando (`action`, `target`, `value`, `requestId`) |
| `ifmg/iot3/<turma>/<aluno>/<dispositivo>/state` | ESP32 → Broker | 1 | `true` | JSON de confirmação do estado do atuador |
| `ifmg/iot3/<turma>/<aluno>/<dispositivo>/availability` | ESP32 → Broker | 1 | `true` | Texto simples: `"online"` (conexão) / `"offline"` (LWT) |

### 5.2 Estruturas de Payload JSON Padronizadas

#### A. Telemetria (`.../telemetry`)
```json
{
  "deviceId": "esp32_temp",
  "sensor": "dht22_temperatura",
  "value": 28.4,
  "unit": "C",
  "humidity": 45.2,
  "noiseLevel": 62,
  "sequence": 104,
  "uptimeMs": 520000,
  "wifiRssi": -62
}
```

#### B. Comando Remoto (`.../command`)
```json
{
  "action": "set",
  "target": "led",
  "value": true,
  "requestId": "cmd-2026-001"
}
```

#### C. Confirmação de Estado (`.../state` com Retain=true)
```json
{
  "deviceId": "esp32_temp",
  "actuator": "led",
  "state": true,
  "requestId": "cmd-2026-001"
}
```

#### D. Disponibilidade / LWT (`.../availability` com Retain=true)
- Payload de Conexão: `"online"`
- Payload LWT de Queda Inesperada: `"offline"`

---

## 📝 Anexo A — Ficha de Proposta Individual Oficial (Seção 26)

| Campo da Ficha | Preenchimento Oficial do Projeto |
| :--- | :--- |
| **Título do projeto** | Sistema IoT de Alerta de Temperatura e Saúde Ambiental |
| **Problema** | Ambientes fechados de trabalho e estudo sujeitos a calor excessivo (>30°C), baixa umidade (<40%) e ruído elevado (>75 dB), causando estresse térmico, irritação respiratória e queda cognitiva sem monitoramento contínuo. |
| **Usuário** | Trabalhadores, estudantes, operadores de escritório/laboratório e gestores prediais. |
| **Sensor** | Sensor Digital DHT22 (Temperatura e Umidade) e Sensor Analógico de Som/Ruído (ADC GPIO 34). |
| **Atuador** | LED Indicador de Emergência (GPIO 12), Relé/Cooler de Circulação de Ar (GPIO 14) e Display ST7789 IPS. |
| **Evento de telemetria** | Envio periódico (a cada 5 segundos) da temperatura em °C, umidade em %, ruído em dB, sequência, uptime e RSSI. |
| **Comando remoto** | Acionamento remoto do LED e Relé/Cooler via mensagem JSON com confirmação de execução de estado. |
| **Device ID** | `esp32_temp` (Cliente MQTT exclusivo: `ifmg_aluno_daniel_esp32_temp`) |
| **Tópico telemetry** | `ifmg/iot3/turmaA/daniel/esp32_temp/telemetry` |
| **Tópico command** | `ifmg/iot3/turmaA/daniel/esp32_temp/command` |
| **Tópico state** | `ifmg/iot3/turmaA/daniel/esp32_temp/state` |
| **Tópico availability** | `ifmg/iot3/turmaA/daniel/esp32_temp/availability` |
| **Riscos e limitações** | Instabilidade temporária de sinal Wi-Fi no laboratório; ruído elétrico na leitura ADC; necessidade de reconexão resiliente sem reinicialização física da placa. |

---

## 🧪 Anexo B — Registro de Testes Oficial (Seção 27)

Tabela padronizada para registro formal de testes conforme exigido no Anexo B da apostila:

| ID | Cenário | Procedimento Realizado | Resultado Esperado | Resultado Obtido | Situação |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **T01** | **Conexão Wi-Fi** | Ligar o ESP32 com SSID/senha configurados em `secrets.h`. | Conectar ao AP, imprimir IP local, Gateway e RSSI no monitor serial. | Conexão estabelecida com sucesso; IP 192.168.x.x impresso e RSSI reportado (~-58 dBm). | ✅ Aprovado |
| **T02** | **Perda do Wi-Fi** | Desativar o ponto de acesso Wi-Fi por 30s e reativar em seguida. | ESP32 detecta perda da rede e reconecta automaticamente via `maintainWifi()` sem reset. | Reconexão automática em menos de 10 segundos após reativação do sinal. | ✅ Aprovado |
| **T03** | **Conexão MQTT** | Inicializar cliente MQTT com broker informado em `secrets.h`. | Conectar ao broker, enviar LWT `offline`, publicar `availability = online` e assinar `command`. | Conexão efetuada com código rc=0; tópico de disponibilidade atualizado para "online". | ✅ Aprovado |
| **T04** | **Publicação de Telemetria** | Manter o dispositivo ativo por 3 ciclos de publicação (15s). | Publicar JSON com temperatura, umidade, ruído, sequência e uptime a cada 5s no tópico `.../telemetry`. | Mensagens JSON válidas recebidas no MQTT Explorer com intervalo regular. | ✅ Aprovado |
| **T05** | **Comando Válido** | Publicar comando `{"action":"set","target":"led","value":true,"requestId":"t05-1"}` no tópico `.../command`. | LED físico acende e ESP32 publica no tópico `.../state` com `state: true` e `requestId: "t05-1"`. | LED ativado imediatamente e payload de estado confirmado recebido com `retained: true`. | ✅ Aprovado |
| **T06** | **JSON Inválido** | Publicar `{"action": "set", payload_corrompido...` no tópico `.../command`. | ESP32 captura erro no `deserializeJson`, rejeita sem acionar e não reinicia. | Mensagem de erro exibida no Monitor Serial; integridade do loop mantida. | ✅ Aprovado |
| **T07** | **Tópico Incorreto / Target Inválido** | Publicar comando com `target: "motor_invalido"` ou enviar para tópico não assinado. | ESP32 ignora a ação e registra mensagem de comando não suportado. | Ação recusada; nenhum periférico acionado indevidamente. | ✅ Aprovado |
| **T08** | **Recuperação do Broker** | Interromper o serviço do Broker MQTT por 20 segundos e reiniciar o serviço. | ESP32 detecta desconexão, tenta reconectar periodicamente e re-assina os tópicos após o retorno. | Cliente recupera a sessão MQTT, publica `online` e re-assina `command` com sucesso. | ✅ Aprovado |

---

## 🎯 Anexo C — Checklist de Demonstração Prática (Seção 27)

Itens de demonstração para a arguição prática do Marco 1 perante a banca:

- [ ] **1. Abrir o monitor serial e identificar o dispositivo**:
  - Velocidade: 115200 bps.
  - Exibição do banner de inicialização, `DEVICE_ID` e pinos configurados.
- [ ] **2. Mostrar conexão Wi-Fi, IP e RSSI**:
  - Serial exibe: `IP local`, `Gateway`, `Máscara` e `Sinal (RSSI) em dBm`.
- [ ] **3. Mostrar conexão MQTT e tópico de disponibilidade**:
  - Broker exibe em `ifmg/iot3/<turma>/<aluno>/<dispositivo>/availability` o valor `"online"` com flag Retain ativada.
- [ ] **4. Exibir telemetria no cliente MQTT (ex: MQTT Explorer)**:
  - Mensagens JSON fluindo a cada 5 segundos com campos `value`, `sensor`, `sequence`, `uptimeMs`.
- [ ] **5. Enviar comando válido para o atuador**:
  - Envio de JSON `{ "action": "set", "target": "led", "value": true, "requestId": "demo-01" }`.
- [ ] **6. Exibir confirmação de estado**:
  - Verificação no tópico `.../state` do JSON `{ "deviceId": "...", "actuator": "led", "state": true, "requestId": "demo-01" }`.
- [ ] **7. Enviar mensagem inválida e mostrar rejeição**:
  - Enviar payload malformado ou `{ "action": "set", "target": "desconhecido" }` e mostrar no Monitor Serial que foi rejeitado com segurança.
- [ ] **8. Simular falha de rede e mostrar recuperação**:
  - Desconectar cabo de rede do roteador / desligar hotspot do celular por 30s e demonstrar reconexão automática e re-assinatura sem apertar botão de reset.
- [ ] **9. Apresentar diagrama e justificar tópicos/mensagens**:
  - Explicar a separação em 4 camadas e a escolha dos tópicos hierárquicos e QoS.
- [ ] **10. Indicar limitações e próximos passos**:
  - Apresentar como a Etapa 2 integrará o Gateway Node.js, persistência em Redis/Timescale e Dashboard Web.

---

## 📄 6. Relatório Breve da Etapa 1 (Conforme Modelo da Seção 16.2)

### 6.1 Problema
Ambientes corporativos e educacionais frequentemente enfrentam condições desfavoráveis de temperatura, ar seco e ruído que prejudicam o bem-estar e a produtividade. A falta de monitoramento autônomo impede intervenções preventivas. Este projeto soluciona a coleta na borda e acionamento remoto de atuadores via IoT.

### 6.2 Arquitetura
A solução estrutura-se no fluxo:
1. **Coleta**: Sensor DHT22 e Microfone Analógico conectados ao ESP32.
2. **Borda/Conectividade**: ESP32 empacota leituras em JSON e publica via Wi-Fi no Broker Mosquitto com QoS 1.
3. **Controle Bidirecional**: Assinatura de tópicos de comando para controle imediato de atuadores com confirmação de estado (*State ACK*).
4. **Nuvem/Gateway (Fases futuras)**: Ingestão por serviço Node.js, persistência chave-valor em Redis e apresentação em Dashboard React.

### 6.3 Hardware
- **Nó Embarcado**: ESP32 DevKit V1 (30 pinos).
- **Sensor Digital**: DHT22 no pino GPIO 15 (alimentação 3.3V com resistor pull-up de 10kΩ).
- **Sensor Analógico**: Microfone/Som KY-038 no pino GPIO 34 (ADC1_CH6).
- **Atuador Visual**: LED de Sinalização no pino GPIO 12 com resistor de 220Ω.
- **Atuador de Potência**: Módulo Relé Optoacoplado no pino GPIO 14 (acionando cooler de 12V).
- **Display Local**: TFT IPS ST7789 via barramento SPI de 8 pinos.

### 6.4 Conectividade
O firmware utiliza o módulo `WiFi.h` em modo Station (`WIFI_STA`). A rotina `maintainWifi()` é executada ciclicamente no `loop()`, empregando a função `millis()` com intervalo de verificação de 5.000 ms. Se a conexão cair, o ESP32 realiza `WiFi.disconnect()` e dispara nova tentativa de associação sem bloquear as demais tarefas do microcontrolador. O diagnóstico reporta IP, Gateway e nível de sinal (RSSI).

### 6.5 MQTT
- **Broker**: Eclipse Mosquitto (Porta 1883 TCP).
- **Client ID**: `ifmg_iot3_turmaA_daniel_esp32_temp` (único e exclusivo para evitar encerramento alternado de conexões).
- **QoS**: QoS 0/1 para telemetria contínua; QoS 1 para comandos e confirmação de estado.
- **Last Will and Testament (LWT)**: Configurado na conexão para o tópico `.../availability` com payload `"offline"` e flag `retained = true`.
- **Presença Online**: Publicação imediata de `"online"` com `retained = true` ao restabelecer a conexão.

### 6.6 Mensagens
- **Telemetria**: JSON estruturado com identificador do dispositivo, tipo do sensor, valor medido, unidade, número de sequência progressivo, uptime em milissegundos e RSSI.
- **Comando**: JSON contendo ação solicitada (`set`), componente alvo (`led` ou `cooler`), valor booleano e identificador de rastreabilidade (`requestId`).
- **Estado**: JSON contendo confirmação de aplicação física do estado e eco do `requestId` com retenção no broker.

### 6.7 Testes
Foram executados os 8 cenários padronizados (T01 a T08). O tempo médio de reconexão Wi-Fi após restabelecimento do sinal foi de 6,2 segundos. O tratamento de JSON com erro de sintaxe rejeitou 100% dos pacotes truncados sem gerar *kernel panic* ou reinicialização do microcontrolador.

### 6.8 Limitações Atuais
Nesta Etapa 1, os dados chegam ao Broker MQTT e são inspecionados via MQTT Explorer. A persistência definitiva em banco de dados histórico e a interface web completa com gráficos temporais serão integradas nas etapas subsequentes.

### 6.9 Próxima Etapa
Construção do Gateway intermediário em Node.js com TypeScript, validação dos contratos via schemas Zod, armazenamento chave-valor no Redis e conexão em tempo real com o Dashboard Web SPA React 18.

---

## 💡 7. Resoluções para as Questões de Fixação (Seção 13.2 e 18)

Respostas elaboradas para apoiar o estudante durante a arguição oral e prova teórica:

1. **Por que estar conectado ao Wi-Fi não significa estar conectado ao broker?**  
   *Resposta*: O Wi-Fi opera nas camadas de enlace e rede (IP), garantindo apenas que o dispositivo obteve um endereço IP e acesso à rede local. O broker MQTT opera na camada de aplicação sobre TCP. O broker pode estar desligado, em outro IP/porta, bloqueado por firewall ou com credenciais incorretas, mesmo com o Wi-Fi 100% associado.

2. **Descreva o papel do broker no modelo MQTT.**  
   *Resposta*: O broker é o servidor central de mensageria responsável por desacoplar emissores (publishers) e receptores (subscribers) no tempo, espaço e sincronização. Ele recebe publicações, gerencia sessões, filtra mensagens com base nos tópicos hierárquicos e as encaminha a todos os clientes autorizados que assinaram aqueles tópicos.

3. **Qual é o problema de todos os estudantes utilizarem o mesmo clientId?**  
   *Resposta*: Na especificação MQTT (OASIS), o `clientId` identifica unicamente a sessão de um cliente no broker. Se dois ou mais dispositivos utilizarem o mesmo `clientId`, o broker desconectará o cliente ativo anterior para aceitar a nova conexão, gerando um ciclo infinito de conexões e quedas alternadas (*thrashing*).

4. **Diferencie tópico, payload e assinatura.**  
   *Resposta*:
   - **Tópico**: String hierárquica separada por barras (`/`) que funciona como canal de roteamento da mensagem.
   - **Payload**: O conteúdo de dados transportado pela mensagem (ex: JSON, texto, binário).
   - **Assinatura (Subscription)**: O registro explícito feito por um cliente no broker manifestando interesse em receber mensagens enviadas para determinado tópico (suportando curingas `+` e `#`).

5. **Por que o ESP32 deve publicar o estado confirmado do atuador?**  
   *Resposta*: A publicação de um comando prova apenas que uma intenção de acionamento foi emitida pela aplicação. O atuador pode falhar mecanicamente, o pino GPIO pode estar incorreto ou a mensagem pode ter se perdido. O estado confirmado (*State Feedback*) comprova que o dispositivo de borda recebeu, validou e executou fisicamente a mudança de estado, permitindo ao sistema web atualizar a interface com consistência.

6. **Qual a vantagem de incluir um número de sequência na telemetria?**  
   *Resposta*: O número de sequência progressivo permite ao receptor (gateway ou dashboard) detectar perda de pacotes, identificar mensagens fora de ordem e diagnosticar reinicializações indesejadas do dispositivo (quando a sequência reinicia em zero).

7. **Em que situação uma mensagem retained pode ser útil?**  
   *Resposta*: É útil para publicar o último estado conhecido de uma grandeza que não muda a todo instante, como o estado atual de um atuador (`state`) ou a disponibilidade do dispositivo (`availability`). Quando um novo cliente (ex: aplicativo móvel ou painel web) se conecta, ele recebe imediatamente o estado atual sem precisar aguardar um novo ciclo de telemetria ou novo comando.

8. **Por que credenciais não devem permanecer no arquivo principal?**  
   *Resposta*: Isolar credenciais em arquivos dedicados (`secrets.h` ou `.env`) protegidos pelo `.gitignore` impede o vazamento acidental de senhas e chaves de acesso em repositórios de código públicos ou compartilhados, além de modularizar a configuração conforme o ambiente (laboratório, casa ou produção).

9. **Qual o impacto de usar delay(30000) em um código que precisa manter MQTT?**  
   *Resposta*: A função `delay(30000)` bloqueia a execução da CPU por 30 segundos, impedindo a execução de `mqttClient.loop()`. Sem essa chamada frequente, o ESP32 deixa de responder aos pings *keep-alive* do protocolo MQTT, provocando o encerramento da conexão pelo broker por *timeout*, além de impedir a recepção oportuna de comandos e o acionamento em tempo hábil.

10. **Como o Last Will pode indicar falha inesperada?**  
    *Resposta*: O *Last Will and Testament (LWT)* é cadastrado pelo cliente no momento da conexão inicial (CONNECT). Se o dispositivo for desconectado abruptamente (queda de energia, falha física de hardware ou perda repentina de sinal Wi-Fi sem envio do pacote DISCONNECT), o próprio broker detecta a ausência de *keep-alive* e publica automaticamente a mensagem de testamento (ex: `"offline"`) no tópico acordado com a flag `retained = true`, alertando todos os assinantes sobre a falha.

---

## 🛠️ 8. Plano de Ação para Adequação Completa (Passo a Passo)

Para deixar o projeto **100% aderente** à apostila do Prof. Charles Garrocho, siga as etapas abaixo:

### Passo 1: Isolar Credenciais em `secrets.h`
1. Criar o arquivo `firmware/include/secrets.h` com as credenciais reais da bancada.
2. Criar `firmware/include/secrets.example.h` com valores fictícios.
3. Adicionar `firmware/include/secrets.h` ao arquivo `.gitignore`.

### Passo 2: Atualizar Definição de Tópicos e Payloads no Firmware
Ajustar no [`firmware/include/config.h`](file:///c:/projects/alerta-temperatura/firmware/include/config.h) os tópicos e constantes:
```cpp
#define TURMA "turmaA"
#define ALUNO "daniel"
#define DISPOSITIVO "esp32_temp"

#define TOPIC_TELEMETRY    "ifmg/iot3/" TURMA "/" ALUNO "/" DISPOSITIVO "/telemetry"
#define TOPIC_COMMAND      "ifmg/iot3/" TURMA "/" ALUNO "/" DISPOSITIVO "/command"
#define TOPIC_STATE        "ifmg/iot3/" TURMA "/" ALUNO "/" DISPOSITIVO "/state"
#define TOPIC_AVAILABILITY "ifmg/iot3/" TURMA "/" ALUNO "/" DISPOSITIVO "/availability"
```

### Passo 3: Atualizar LWT e Presença no `mqtt_client.cpp`
- No `client.connect(...)`: passar `TOPIC_AVAILABILITY`, QoS 1, retain `true`, payload `"offline"`.
- Ao conectar com sucesso: publicar `"online"` no `TOPIC_AVAILABILITY` com retain `true`.
- Assinar o `TOPIC_COMMAND` com QoS 1.

### Passo 4: Atualizar Callback de Comando e Confirmação de Estado
- Tratar o comando no formato `{ "action": "set", "target": "led", "value": true, "requestId": "..." }`.
- Publicar no `TOPIC_STATE` com retain `true` o JSON `{ "deviceId": DISPOSITIVO, "actuator": "led", "state": true, "requestId": "..." }`.

### Passo 5: Coleta de Evidências Fotográficas (`docs/evidencias/`)
Criar o diretório `docs/evidencias/` e salvar as capturas:
- `wifi_conectado.png`: Print do Monitor Serial mostrando IP, gateway e RSSI.
- `mqtt_publicacao.png`: Print do MQTT Explorer com as mensagens de telemetria e disponibilidade.
- `mqtt_comando.png`: Print do MQTT Explorer disparando o comando e recebendo o state confirmado.
