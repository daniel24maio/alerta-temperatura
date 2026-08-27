# Entrega 1 - Planejamento e Arquitetura do Projeto IoT

**Disciplina**: Arquitetura de Soluções de Internet das Coisas (IoT)  
**Projeto**: Sistema de Alerta de Temperatura e Saúde Ambiental IoT  
**Data**: Agosto / 2026  
**Documento**: Consolidação dos Produtos Esperados para a Entrega 1  

---

## SUMÁRIO

1. **PRODUTO 1: REGISTRO DIAGNÓSTICO INICIAL**
   - 1.1 Contexto e Diagnóstico de Competências da Equipe
   - 1.2 Matriz de Conhecimentos Prévios e Oportunidades
   - 1.3 Identificação de Riscos e Estratégias de Mitigação
   - 1.4 Ferramentas e Ambiente de Desenvolvimento

2. **PRODUTO 2: PROPOSTA DO PROJETO**
   - 2.1 Identificação do Problema e Necessidade
   - 2.2 Objetivos Geral e Específicos
   - 2.3 Especificação Técnica dos Sensores
   - 2.4 Especificação Técnica dos Atuadores
   - 2.5 Matriz de Regras Ambientais e Saúde Ocupacional

3. **PRODUTO 3: DIAGRAMA DA ARQUITETURA IOT**
   - 3.1 Desenho Gráfico da Arquitetura (Visão de Componentes e Camadas)
   - 3.2 Diagrama em Blocos da Solução Mono-Repo Containerizada
   - 3.3 Detalhamento das 4 Camadas IoT e Relações entre Componentes

4. **PRODUTO 4: FLUXO INICIAL DE DADOS E MENSAGENS DOCUMENTADO**
   - 4.1 Mapeamento e Hierarquia de Tópicos MQTT
   - 4.2 Diagramas de Sequência dos Fluxos do Sistema
     - 4.2.1 Fluxo 1: Conexão, Presença e Mensagem de Desconexão (LWT)
     - 4.2.2 Fluxo 2: Leitura dos Sensores, Atualização do Display e Telemetria
     - 4.2.3 Fluxo 3: Envio de Comando Remoto e Confirmação de Execução (ACK)
   - 4.3 Schemas de Mensagens JSON e Contratos Zod

---

<div style="page-break-after: always;"></div>

# 1. PRODUTO 1: REGISTRO DIAGNÓSTICO INICIAL

## 1.1 Contexto e Diagnóstico de Competências da Equipe
O desenvolvimento de soluções de Internet das Coisas (IoT) exige a integração harmônica entre hardware embarcado, redes sem fio, protocolos de mensagens pub/sub, armazenamento persistente e aplicações de apresentação web. 

Este diagnóstico inicial avaliou a maturidade técnica da equipe para estruturar o plano de desenvolvimento do projeto **"Alerta de Temperatura e Saúde Ambiental IoT"**.

## 1.2 Matriz de Conhecimentos Prévios e Oportunidades

| Domínio Tecnológico | Nível Inicial | Conhecimentos Prévios | Oportunidades de Aprendizado e Desafios |
| :--- | :---: | :--- | :--- |
| **Microcontroladores & Embarcados** | Intermediário | Lógica de programação C/C++, pinagem básica de placas Arduino. | Aprendizado de programação do **ESP32** em C++ (PlatformIO) e em **JavaScript (Runtime Espruino)**; uso do barramento **SPI de 8 pinos** para o Display TFT ST7789 IPS. |
| **Sensoriamento & Atuação** | Básico/Intermediário | Leitura de sensores analógicos e digitais simples. | Leitura combinada de **Temperatura/Umidade (DHT22)** e amostragem analógica **ADC (Sensor de Som)** com aplicação de limiares dinâmicos de alerta. |
| **Redes e Protocolos IoT** | Intermediário | Redes Wi-Fi, requisições HTTP REST convencionais. | Protocolo **MQTT**: diferenciação entre QoS 0/1/2, mensagens com retenção (*Retain*), contratos de **Last Will and Testament (LWT)** e reconexão resiliente. |
| **Backend & Processamento Edge** | Avançado | JavaScript/TypeScript, APIs REST em Node.js. | Integração de clientes MQTT com subscrição de tópicos *wildcard* (`+`), validação estrita de contratos JSON com **Zod** e persistência em banco chave-valor **Redis**. |
| **Frontend & Interface Web** | Avançado | HTML, CSS, React, consumo de APIs. | Construção de Dashboard SPA em **React 18 + TailwindCSS**, incluindo simulador gráfico em tempo real do Display ST7789 IPS e testes automatizados com **Vitest**. |
| **Infraestrutura & DevOps** | Intermediário | Utilização básica do Docker. | Orquestração da stack completa (`mosquitto`, `redis`, `backend`, `frontend`) via **Docker Compose** e deploy em 1 clique via **Portainer Stack**. |

## 1.3 Identificação de Riscos e Estratégias de Mitigação
1. **Ausência de Hardware Físico Durante Testes**: Desenvolvimento de um **Simulador ESP32 Interativo em Node.js** (`backend/tests/simulator.ts`) e firmware em **JavaScript Espruino**, permitindo validar 100% da telemetria, recepção de comandos e publicação de ACK sem a placa física.
2. **Queda de Conexão Wi-Fi ou Broker MQTT**: Implementação de loops de reconexão automática não-bloqueantes e configuração do **Last Will and Testament (LWT)** no broker Mosquitto.
3. **Falha de Atuação sem Confirmação**: Implementação de mensagens de resposta **ACK** emitidas pelo ESP32 com timeout de 5 segundos no Gateway.

## 1.4 Ferramentas e Ambiente de Desenvolvimento
- **IDE**: Visual Studio Code com extensões PlatformIO, TailwindCSS e Vitest Explorer.
- **Gerenciamento do Repositório**: Git em formato Mono-Repositório.
- **Orquestração**: Docker Compose e Portainer Stack.

---

<div style="page-break-after: always;"></div>

# 2. PRODUTO 2: PROPOSTA DO PROJETO

## 2.1 Identificação do Problema e Necessidade
Ambientes fechados de trabalho, estudo ou linhas de produção sofrem constantemente com variações ambientais críticas:
- **Temperaturas Elevadas (>30°C)**: Causam fadiga, estresse térmico e desidratação.
- **Baixa Umidade Relativa (<40%)**: Provoca ressecamento das vias aéreas e desconforto respiratório.
- **Ruído Sonoro Elevado (>75 dB)**: Gera perda de concentração, irritabilidade e fadiga auditiva.

**Necessidade**: Criar um sistema IoT de monitoramento contínuo capaz de exibir alertas visuais no próprio local em um display colorido, transmitir telemetria para a nuvem via MQTT e acionar atuadores (coolers, relés, alarmes) automaticamente ou por comando remoto.

## 2.2 Objetivos Geral e Específicos
- **Objetivo Geral**: Implementar um sistema IoT completo (End-to-End) para monitoramento ambiental, alertas de saúde e controle de atuadores com confirmação de execução (ACK).
- **Objetivos Específicos**:
  - Medir Temperatura, Umidade (DHT22) e Som Ambiente (ADC) via ESP32.
  - Exibir alertas no Display TFT IPS Colorido ST7789 (2.25" SPI).
  - Transmitir telemetria via MQTT (QoS 1) com LWT e reconexão automática.
  - Validar payloads no Gateway Node.js com Zod e armazenar no Redis.
  - Disponibilizar Dashboard Web em React 18 + TailwindCSS.

## 2.3 Especificação Técnica dos Sensores

| Sensor | Modelo | Interface ESP32 | Grandeza Medida | Limiares de Alerta |
| :--- | :--- | :---: | :--- | :--- |
| **Temperatura & Umidade** | **DHT22** (AM2302) | Digital (GPIO 15) | Temp. (°C) / Umidade (%) | Temp > 30°C / Umidade < 40% |
| **Ruído / Som Ambiente** | **KY-038 / MAX4466** | Analógico ADC1 (GPIO 34) | Nível de Som (dB) | Ruído > 75 dB (ADC > 700) |

## 2.4 Especificação Técnica dos Atuadores

| Atuador | Modelo / Componente | Interface ESP32 | Função no Sistema |
| :--- | :--- | :---: | :--- |
| **Display Local** | **TFT IPS ST7789 (2.25" 76x284)** | SPI Hardware (8 Pinos) | Exibição das métricas e alertas coloridos em tempo real. |
| **Circulador / Potência**| **Módulo Relé / Cooler** | Digital Output (GPIO 14) | Circulação de ar ao exceder 30°C. |
| **Alerta Visual/Sonoro** | **LED / Buzzer** | Digital Output (GPIO 12) | Sinalização luminosa e sonora em condições críticas. |

## 2.5 Matriz de Regras Ambientais e Saúde Ocupacional
1. **Temp > 30°C**: Display: `ALERTA: Temp >30C! Beba agua & ar em circulacao` | Atuador: Liga Cooler (GPIO 14).
2. **18°C ≤ Temp ≤ 30°C e Umidade < 40%**: Display: `ALERTA: Baixa umid! Hidrate-se / Evite ex. intenso` | Atuador: Bip sonoro.
3. **Temp > 30°C e Umidade < 40% (CRÍTICO)**: Display: `CRITICO: Temp/Umid! Hidratar & ativ. baixa intens.` | Atuador: Liga LED (GPIO 12) + Cooler (GPIO 14).
4. **Ruído > 75 dB**: Display: `ALERTA: Ruido alto! Favor manter silencio no local` | Atuador: Liga LED Alerta (GPIO 12).

---

<div style="page-break-after: always;"></div>

# 3. PRODUTO 3: DIAGRAMA DA ARQUITETURA IOT

## 3.1 Desenho Gráfico da Arquitetura (Visão de Componentes e Camadas)

```text
========================================================================================================
                                 DIAGRAMA DA ARQUITETURA IOT COMPLETA
========================================================================================================

 [ CAMADA 1: PERCEPÇÃO E ATUAÇÃO ]
 +--------------------------------------------------------------------------------------------------+
 |                                                                                                  |
 |   +------------------------+      +----------------------------------+     +------------------+  |
 |   |  Sensor Temp/Umidade   |----->|        ESP32 MICROCONTROLLER     |---->| Display TFT IPS  |  |
 |   |  DHT22 (Digital G15)   |      |        Dual-Core 240MHz           |     | ST7789 (SPI 8P)  |  |
 |   +------------------------+      |  - Runtime Espruino JS / C++     |     +------------------+  |
 |                                   |  - Avaliação de Regras           |                           |
 |   +------------------------+      |  - Display ST7789 Driver         |     +------------------+  |
 |   |  Sensor de Som (ADC)   |----->|  - Wi-Fi & MQTT Client            |---->| Atuadores GPIO   |  |
 |   |  KY-038 (Analog G34)   |      +-----------------+----------------+     | LED:G12  Relé:G14|  |
 |   +------------------------+                        |                      +------------------+  |
 |                                                     |                                            |
 +-----------------------------------------------------|--------------------------------------------+
                                                       |
 [ CAMADA 2: REDE E COMUNICAÇÃO ]                      | (Wi-Fi 802.11 b/g/n - MQTT/JSON TCP)
                                                       v
 +--------------------------------------------------------------------------------------------------+
 |                                   BROKER MQTT (ECLIPSE MOSQUITTO)                                |
 |                                   Porta 1883 (TCP) / Porta 9001 (WS)                             |
 |                                   QoS 1 | Retain | LWT Status Offline                            |
 +-----------------------------------------------------+--------------------------------------------+
                                                       |
 [ CAMADA 3: GATEWAY E ARMAZENAMENTO ]                 | (Assinaturas Wildcard v1/devices/+/...)
                                                       v
 +--------------------------------------------------------------------------------------------------+
 |   GATEWAY BACKEND NODE.JS + TYPESCRIPT                                                           |
 |   - Servidor API REST Express (Porta 5000)                                                       |
 |   - Validador de Schemas JSON (Zod)                                                              |
 |   - Middleware de Autenticação Básica (HTTP Basic Auth)                                          |
 |   - Cliente MQTT (Roteamento & Dispatcher ACK)                                                   |
 |                                                                                                  |
 |                                   +----------------------------------+                           |
 |                                   | Banco Chave-Valor Redis (P 6379) |                           |
 |                                   |  - Estado Atual: device:id:state |                           |
 |                                   |  - Presença: device:id:presence  |                           |
 |                                   |  - Histórico: device:id:history  |                           |
 |                                   +----------------------------------+                           |
 +-----------------------------------------------------+--------------------------------------------+
                                                       |
 [ CAMADA 4: APLICAÇÃO E APRESENTAÇÃO ]                | (API REST HTTP/JSON / Basic Auth)
                                                       v
 +--------------------------------------------------------------------------------------------------+
 |   FRONTEND DASHBOARD WEB (REACT 18 + TYPESCRIPT + VITE + TAILWIND CSS)                           |
 |   - Porta 3000 (Nginx / Node)                                                                    |
 |   - Badge de Presença (Online/Offline + lastSeen)                                                |
 |   - Gauges em Tempo Real (Temperatura, Umidade, Nível de Som em dB)                              |
 |   - Simulador Gráfico do Display ST7789 IPS SPI (2.25")                                          |
 |   - Painel de Controle de Atuador Remoto com Resposta ACK                                        |
 |   - Tabela de Histórico Temporal de Telemetria                                                   |
 +--------------------------------------------------------------------------------------------------+
========================================================================================================
```

## 3.2 Diagrama em Blocos da Solução Mono-Repo Containerizada

```text
+-----------------------------------------------------------------------------------------+
|                                PORTAINER STACK (DOCKER COMPOSE)                         |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|   +--------------------------+    +--------------------------+    +------------------+  |
|   |   mosquitto (Service)    |    |     redis (Service)      |    | backend (Service)|  |
|   |  - Image: eclipse-mosq   |    |  - Image: redis:alpine   |    | - Node.js + TS   |  |
|   |  - Port: 1883 (MQTT)     |    |  - Port: 6379 (KV Store) |    | - API REST :5000 |  |
|   |  - Port: 9001 (Websocket)|    |  - Volume: redis-data    |    | - Zod Validator  |  |
|   +------------+-------------+    +------------+-------------+    +--------+---------+  |
|                ^                               ^                           ^            |
|                |                               |                           |            |
|                +-------------------------------+---------------------------+            |
|                                                                            ^            |
|                                                                            |            |
|                                                                   +--------+---------+  |
|                                                                   |frontend (Service)|  |
|                                                                   | - React 18 + Vite|  |
|                                                                   | - TailwindCSS    |  |
|                                                                   | - Port: 3000     |  |
|                                                                   +------------------+  |
+-----------------------------------------------------------------------------------------+
```

## 3.3 Detalhamento das 4 Camadas IoT e Relações entre Componentes

1. **Camada de Percepção e Atuação**: O ESP32 realiza a leitura do DHT22 e amostragem ADC do sensor de som. Avalia as 4 regras de saúde localmente, atualiza o Display ST7789 SPI de 8 pinos e aciona atuadores de emergência (GPIO 14 e 12).
2. **Camada de Rede e Comunicação**: Utiliza a rede Wi-Fi para conectar ao Broker Eclipse Mosquitto. O protocolo MQTT garante entrega com QoS 1 e notificação de desconexão acidental via Last Will and Testament (LWT).
3. **Camada de Gateway e Armazenamento**: O Backend Node.js assina os tópicos wildcard `v1/devices/+/...`. Valida os payloads JSON com schemas Zod e persiste o estado, presença e histórico no Redis.
4. **Camada de Aplicação**: O Frontend React consome a API REST protegida por HTTP Basic Auth e exibe o dashboard visual para o operador.

---

<div style="page-break-after: always;"></div>

# 4. PRODUTO 4: FLUXO INICIAL DE DADOS E MENSAGENS DOCUMENTADO

## 4.1 Mapeamento e Hierarquia de Tópicos MQTT

| Tópico MQTT | Sentido | QoS | Retain | Finalidade |
| :--- | :---: | :---: | :---: | :--- |
| `v1/devices/{deviceId}/telemetry` | ESP32 -> Gateway | **1** | `false` | Envio periódico (5s) das leituras de temperatura, umidade, ruído, código de alerta, texto do display e estado do atuador. |
| `v1/devices/{deviceId}/status` | ESP32 -> Gateway | **1** | **`true`** | Registro de presença `online` e mensagem LWT `offline` enviada pelo broker em desconexão. |
| `v1/devices/{deviceId}/commands` | Gateway -> ESP32 | **1** | `false` | Comandos remotos de acionamento do atuador. |
| `v1/devices/{deviceId}/commands/ack` | ESP32 -> Gateway | **1** | `false` | Confirmação de execução emitida pelo ESP32. |

## 4.2 Diagramas de Sequência dos Fluxos do Sistema

### 4.2.1 Fluxo 1: Conexão, Presença e Mensagem de Desconexão (LWT)
```text
ESP32                    Broker MQTT (Mosquitto)           Gateway Node.js              Banco Redis
  |                                 |                             |                          |
  |--- 1. CONNECT (ClientID, LWT) ->|                             |                          |
  |<-- 2. CONNACK (Sucesso) --------|                             |                          |
  |                                 |                             |                          |
  |--- 3. PUBLISH "status:online" ->|                             |                          |
  |    (QoS 1, Retain True)         |--- 4. Repassa Mensagem ---->|                          |
  |                                 |                             |--- 5. Save Presence ---->|
  |                                 |                             |    (status = online)     |
  |                                 |                             |                          |
  |=== (Queda Inesperada de Conexão Wi-Fi / Energia) =======================================|
  |                                 |                             |                          |
  |                                 |--- 6. Dispara LWT Retained->|                          |
  |                                 |    ("status: offline")      |--- 7. Update Status ---->|
  |                                 |                             |    (status = offline)    |
```

### 4.2.2 Fluxo 2: Leitura dos Sensores, Atualização do Display e Telemetria
```text
Sensores DHT22/Som      ESP32 / Display ST7789          Broker MQTT         Gateway / Redis         React Dashboard
  |                            |                             |                     |                       |
  |-- 1. Leitura Temp/Umid/Som->|                             |                     |                       |
  |                            |-- 2. Avalia 4 Regras        |                     |                       |
  |                            |-- 3. Renderiza ST7789 SPI   |                     |                       |
  |                            |                             |                     |                       |
  |                            |-- 4. PUBLISH "telemetry" -->|                     |                       |
  |                            |    (Payload JSON, QoS 1)    |-- 5. Repassa ------>|                       |
  |                            |                             |                     |-- 6. Valida Zod ----->|
  |                            |                             |                     |-- 7. Salva KV Redis ->|
  |                            |                             |                     |                       |
  |                            |                             |                     |<-- 8. GET /devices ---|
  |                            |                             |                     |--- 9. JSON Estado --->|
```

### 4.2.3 Fluxo 3: Envio de Comando Remoto e Confirmação de Execução (ACK)
```text
Operador Web             React Dashboard              Gateway Node.js         Broker MQTT             ESP32 / GPIO 14
  |                             |                             |                    |                         |
  |-- 1. Clicar em "Atuador" -->|                             |                    |                         |
  |                             |-- 2. POST /command -------->|                    |                         |
  |                             |   (Basic Auth, JSON)        |-- 3. PUBLISH ----->|                         |
  |                             |                             |   "commands"       |-- 4. Repassa Comando -->|
  |                             |                             |                    |                         |-- 5. Aciona GPIO 14
  |                             |                             |                    |<-- 6. PUBLISH "ack" ----|
  |                             |                             |<-- 7. Repassa ACK--|    (QoS 1)               |
  |                             |                             |-- 8. Resolve Promise                         |
  |                             |<-- 9. HTTP 200 OK (ACK) ----|                                              |
  |<-- 10. Exibe Confirmação ---|                                                                             |
```

## 4.3 Schemas de Mensagens JSON e Contratos Zod

### Payload de Telemetria (`v1/devices/{deviceId}/telemetry`)
```json
{
  "temp": 32.5,
  "humidity": 35.0,
  "noiseLevel": 78,
  "alerts": ["HIGH_TEMP", "HIGH_NOISE"],
  "lcdText": "ALERTA: Temp >30C! Beba agua & ar em circulacao",
  "displayType": "ST7789_SPI",
  "actuatorState": true,
  "timestamp": 1723500000
}
```

### Payload de Status Online (`v1/devices/{deviceId}/status`)
```json
{
  "status": "online",
  "ip": "192.168.1.105",
  "firmwareVersion": "1.0.0-js",
  "runtime": "Espruino JS",
  "timestamp": 1723500000
}
```

### Payload de Status Offline LWT (`v1/devices/{deviceId}/status`)
```json
{
  "status": "offline",
  "reason": "unexpected_disconnect",
  "timestamp": 1723500000
}
```

### Payload de Comando Remoto (`v1/devices/{deviceId}/commands`)
```json
{
  "commandId": "cmd-8f92a1",
  "action": "SET_ACTUATOR",
  "state": true
}
```

### Payload de Confirmação ACK (`v1/devices/{deviceId}/commands/ack`)
```json
{
  "commandId": "cmd-8f92a1",
  "success": true,
  "state": true,
  "timestamp": 1723500005
}
```

---

# 5. CONCLUSÃO DA ENTREGA 1

A proposta arquitetural desenvolvida contempla de forma rigorosa e detalhada todos os requisitos da **Entrega 1**. A especificação dos componentes embarcados, a modelagem dos fluxos de dados pub/sub via MQTT e a organização mono-repositório containerizada pavimentam o caminho para as próximas etapas do projeto IoT com máxima robustez e clareza técnica.
