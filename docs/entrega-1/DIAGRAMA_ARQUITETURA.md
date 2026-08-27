# Diagrama da Arquitetura IoT - Entrega 1

Este documento descreve a arquitetura geral da solução **Alerta de Temperatura e Saúde Ambiental IoT**, mapeada nas 4 camadas fundamentais de sistemas de Internet das Coisas: **Camada de Dispositivos (Percepção/Atuação)**, **Camada de Rede e Comunicação**, **Camada de Gateway e Armazenamento (Edge/Cloud)** e **Camada de Aplicação e Apresentação**.

---

## 1. Diagrama em Mermaid (Visão de Componentes e Camadas)

```mermaid
graph TD
    subgraph Camada_1 [Camada 1: Percepção e Atuação (Dispositivos Embarcados)]
        DHT22["Sensor DHT22 (Temp & Umidade)"] -->|GPIO 15| ESP32["ESP32 Microcontroller (Dual-Core 240MHz)"]
        SOM["Sensor de Som (ADC KY-038)"] -->|GPIO 34 ADC1| ESP32
        ESP32 -->|SPI 8 Pinos: G18, G23, G4, G2, G5, G32| ST7789["Display TFT IPS ST7789 (2.25' 76x284)"]
        ESP32 -->|GPIO 14| RELE["Relé / Cooler (Circulação de Ar)"]
        ESP32 -->|GPIO 12| LED["LED / Buzzer de Alerta"]
    end

    subgraph Camada_2 [Camada 2: Rede e Comunicação]
        ESP32 <-->|Wi-Fi 802.11 b/g/n| BROKER["Broker MQTT Mosquitto (Porta 1883 / 9001)"]
    end

    subgraph Camada_3 [Camada 3: Gateway, Processamento e Armazenamento]
        BROKER <-->|MQTT Pub/Sub Wildcard v1/devices/+/...| BACKEND["Backend Node.js + TypeScript (Express API)"]
        BACKEND -->|Zod Schema Validation| BACKEND
        BACKEND <-->|ioredis / In-Memory Fallback| REDIS[("Banco Chave-Valor Redis (Estado, Histórico, Presença)")]
    end

    subgraph Camada_4 [Camada 4: Aplicação e Apresentação]
        REACT["Frontend Dashboard React 18 + TailwindCSS"] <-->|API REST HTTP / Basic Auth (Porta 5000)| BACKEND
        USER(("Usuário / Operador")) <-->|Navegador Web (Porta 3000)| REACT
    end

    style ESP32 fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#fff
    style ST7789 fill:#0284c7,stroke:#38bdf8,stroke-width:2px,color:#fff
    style BROKER fill:#0f766e,stroke:#2dd4bf,stroke-width:2px,color:#fff
    style BACKEND fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#fff
    style REDIS fill:#881337,stroke:#fda4af,stroke-width:2px,color:#fff
    style REACT fill:#0369a1,stroke:#38bdf8,stroke-width:2px,color:#fff
```

---

## 2. Diagrama de Blocos Textual (Arquitetura Mono-Repo em Docker)

```text
+-------------------------------------------------------------------------------------------------------+
|                                ARQUITETURA DA SOLUÇÃO IOT COMPLETA                                    |
+-------------------------------------------------------------------------------------------------------+
|                                                                                                       |
|   +---------------------------------------+              +-----------------------+                    |
|   |    DISPOSITIVO ESP32 (FÍSICO OU JS)    |              |   SIMULADOR ESP32     |                    |
|   |  - Display TFT ST7789 SPI (8 Pinos)   |              |  - Script Node.js     |                    |
|   |  - Sensor Temp/Umid DHT22 (GPIO 15)   |              |  - Telemetria + ACK   |                    |
|   |  - Sensor de Som ADC (GPIO 34)        |              |  - Simulação Sensores |                    |
|   |  - Atuadores Relé/LED (GPIO 14/12)    |              +-----------+-----------+                    |
|   |  - LWT Status: "offline"              |                          |                                |
|   +-------------------+-------------------+                          |                                |
|                       | (MQTT / JSON sobre TCP)                      | (MQTT / JSON)                  |
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
|                                |   Gateway Backend Node.js|                                           |
|                                |  - Wildcard Subscriptions|                                           |
|                                |  - Validador Zod JSON    |                                           |
|                                |  - API REST HTTP/JSON    |                                           |
|                                |  - Autenticação Básica   |                                           |
|                                +----+-----------------+---+                                           |
|                                     |                 |                                               |
|                                     v                 v                                               |
|                       +-------------------+    +--------------------+                                 |
|                       | Banco Chave-Valor |    | Frontend React SPA |                                 |
|                       |  (Redis / Memory) |    |  - TailwindCSS UI  |                                 |
|                       |  - Estado Atual   |    |  - Display Virtual |                                 |
|                       |  - Presença LWT   |    |  - Gauges & Chart  |                                 |
|                       |  - Histórico      |    |  - Controle Remoto |                                 |
|                       +-------------------+    +--------------------+                                 |
|                                                                                                       |
+-------------------------------------------------------------------------------------------------------+
```

---

## 3. Relações e Responsabilidades entre Componentes

1. **ESP32 Microcontroller**:
   - Nó sensor/atuador inteligente responsável pela amostragem contínua dos sensores, execução local de regras de emergência, renderização no Display ST7789 SPI e comunicação MQTT.
2. **Broker MQTT (Mosquitto)**:
   - Intermediador Pub/Sub desacoplado, responsável por rotear mensagens de telemetria, presença online/offline (LWT), comandos e confirmações ACK com garantia de entrega (QoS 1).
3. **Gateway Backend (Node.js + TypeScript)**:
   - Servidor central que consome mensagens MQTT via tópicos coringa (`v1/devices/+/...`), valida schemas JSON com Zod, grava dados no banco chave-valor e expõe a API HTTP REST protegida.
4. **Banco Chave-Valor (Redis)**:
   - Armazenamento de baixa latência estruturado em chaves de presença (`device:{id}:presence`), estado atual e listas de histórico temporal (`device:{id}:history`).
5. **Frontend Web Dashboard (React 18 + TailwindCSS)**:
   - Interface do usuário para acompanhamento das métricas de temperatura, umidade e som, visualização da tela virtual do ST7789 e acionamento de comandos remotos.
