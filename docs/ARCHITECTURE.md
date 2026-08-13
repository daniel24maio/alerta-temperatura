# Arquitetura do Sistema: Alerta de Temperatura e Saúde Ambiental IoT

Este documento descreve a arquitetura de solução IoT completa desenvolvida para atendimento dos requisitos das **Etapas 1, 2 e 3** da disciplina de Arquitetura de Soluções de IoT.

---

## 1. Visão Geral e Proposta do Projeto

O projeto **"Alerta de Temperatura e Saúde Ambiental IoT"** é uma solução de telemetria ambiental, segurança do trabalho/conforto térmico-sonoro e atuadores automatizados.

### Objetivos do Sistema:
1. **Sensoriamento no Dispositivo Embarcado (ESP32)**:
   - Medição constante de **Temperatura (°C)** e **Umidade Relativa (%)** via sensor DHT22.
   - Medição contínua do **Nível de Ruído Ambiente (dB)** via sensor analógico de som.
   - Exibição local de alta visibilidade em **Display TFT IPS Colorido ST7789 (2.25" - 76x284 pixels)** operando em barramento SPI (8 pinos).
   - Acionamento automático de **Atuadores** (LED / Relé / Buzzer) sob condições críticas.
2. **Conectividade Resiliente e MQTT**:
   - Conexão Wi-Fi com algoritmo de reconexão automática e não-bloqueante.
   - Publicação de telemetria em formato JSON com **QoS 1**.
   - Gerenciamento de presença através de **Last Will and Testament (LWT)** (`status: offline`).
   - Recepção de comandos remotos e publicação de **confirmação de execução (ACK)**.
3. **Gateway de Nuvem/Edge (Node.js & TypeScript)**:
   - Conexão com o Broker MQTT via subscrições wildcard (`v1/devices/+/...`).
   - Identificação dinâmica de dispositivos conectados.
   - Validação estrita de contratos de payload JSON com **Zod**.
   - Persistência no Banco Chave-Valor (**Redis** com fallback transparente em memória): Estado Atual, Registro de Presença / Visto por Último (`lastSeen`) e Histórico Temporal.
   - **API REST HTTP/JSON** protegida por **Autenticação Básica (Basic Auth)**.
   - **Interface Web Dashboard** em tempo real com Dark Mode moderno, gráficos e simulador do Display ST7789.
4. **Infraestrutura Mono-Repo & Portainer**:
   - Organização modular em mono-repositório.
   - Subida containerizada via **Docker Compose** / **Portainer Stack** dos serviços Mosquitto, Redis e Gateway.

---

## 2. Diagrama Completo da Arquitetura

```text
+-------------------------------------------------------------------------------------------------------+
|                                ARQUITETURA DA SOLUÇÃO IOT COMPLETA                                    |
+-------------------------------------------------------------------------------------------------------+
|                                                                                                       |
|   +---------------------------------------+              +-----------------------+                    |
|   |          ESP32 (Hardware)             |              |   Simulador ESP32     |                    |
|   |  - Display TFT ST7789 SPI (8 pinos)   |              |  - Testes E2E sem HW  |                    |
|   |  - Sensor Temp/Umid DHT22 (GPIO15)    |              |  - Simulação Sensores |                    |
|   |  - Sensor de Som ADC (GPIO34)         |              |  - Node.js Client     |                    |
|   |  - Atuadores LED/Relé (GPIO12/14)     |              +-----------+-----------+                    |
|   |  - Wi-Fi Reconnect & Status LWT       |                          |                                |
|   +-------------------+-------------------+                          |                                |
|                       | (MQTT/JSON)                                  | (MQTT/JSON)                    |
|                       +---------------------+------------------------+                                |
|                                             |                                                         |
|                                             v                                                         |
|                                +--------------------------+                                           |
|                                |   Broker MQTT (Mosquitto) |                                          |
|                                |   Portas: 1883 / 9001    |                                           |
|                                +------------+-------------+                                           |
|                                             |                                                         |
|                                             v                                                         |
|                                +--------------------------+                                           |
|                                |    Gateway Node.js       |                                           |
|                                |  - Subscrição Wildcard   |                                           |
|                                |  - Validador Zod JSON    |                                           |
|                                |  - API REST HTTP/JSON    |                                           |
|                                |  - Autenticação Básica   |                                           |
|                                |  - Web Dashboard UI      |                                           |
|                                +----+-----------------+---+                                           |
|                                     |                 |                                               |
|                                     v                 v                                               |
|                       +-------------------+    +--------------------+                                 |
|                       | Banco Chave-Valor |    | Interface Web (UI) |                                 |
|                       |  - Estado Atual   |    |  - Gauge Temperatura|                                 |
|                       |  - Nível de Som   |    |  - Gauge Umidade    |                                 |
|                       |  - Alertas Ativos |    |  - Nível de Ruído   |                                 |
|                       |  - Presença LWT   |    |  - Display ST7789   |                                 |
|                       +-------------------+    |  - Controle Remoto |                                 |
|                                                +--------------------+                                 |
|                                                                                                       |
+-------------------------------------------------------------------------------------------------------+
```

---

## 3. Matriz de Regras de Alerta Ambiental

| Regra | Condição de Entrada | Alerta Exibido no ST7789 | Código MQTT | Ação de Atuador |
| :---: | :--- | :--- | :--- | :--- |
| **1** | Temp > 30°C | `ALERTA: Temp >30C! Beba agua & ar em circulacao` | `HIGH_TEMP` | Ligar Cooler |
| **2** | 18°C ≤ Temp ≤ 30°C e Umidade < 40% | `ALERTA: Baixa umid! Hidrate-se / Evite ex. intenso` | `LOW_HUMIDITY_MILD` | Bip sonoro |
| **3** | Temp > 30°C e Umidade < 40% | `CRITICO: Temp/Umid! Hidratar & ativ. baixa intens.` | `CRITICAL_HEAT_DRY` | Ativar LED + Relé |
| **4** | Ruído > Limiar (ADC > 700 / > 70dB) | `ALERTA: Ruido alto! Favor manter silencio no local` | `HIGH_NOISE` | Ativar LED Alerta |
