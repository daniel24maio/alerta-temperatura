# Roteiro de Apresentação Final: Alerta de Temperatura e Saúde Ambiental IoT

Este documento contém o roteiro estruturado para a **Apresentação Final** da disciplina de Arquitetura de Soluções de IoT.

---

## 1. Estrutura dos Slides / Apresentação

### Slide 1: Capa & Titulo
- **Título**: Alerta de Temperatura e Saúde Ambiental IoT
- **Subtítulo**: Solução Integrada com ESP32, Display ST7789, MQTT, Gateway Node.js, Banco Chave-Valor e Portainer Stack.
- **Integrantes**: [Nome dos Alunos]

### Slide 2: Problema e Motivação
- Monitoramento de ambientes de trabalho/estudo onde variações extremas de temperatura, baixa umidade ou ruído elevado prejudicam a saúde, a hidratação e o foco.
- Necessidade de alertas visuais instantâneos locais (Display IPS Colorido) e telemetria remota em tempo real.

### Slide 3: Arquitetura da Solução
- Diagrama em blocos demonstrando a comunicação bidirecional:
  - **ESP32** -> **Broker Mosquitto MQTT (QoS 1)** -> **Gateway Node.js (Zod)** -> **Redis** -> **Web Dashboard / API HTTP**.

### Slide 4: Hardware & Display ST7789 SPI
- Apresentação dos periféricos:
  - ESP32 (Dual-Core 240MHz).
  - Display TFT IPS 2.25" ST7789 via barramento SPI de 8 pinos.
  - Sensor DHT22 (Temp/Umidade) e Sensor de Som Analógico (ADC1).

### Slide 5: Tópicos MQTT, QoS, Retain e LWT
- Demonstração dos tópicos `v1/devices/{deviceId}/telemetry`, `commands`, `commands/ack` e `status`.
- Explicação da mensagem Last Will and Testament (LWT) para detecção de falha e desconexão.

### Slide 6: Gateway, Persistência e Segurança
- Validação estrita de contratos JSON com Zod.
- Armazenamento Chave-Valor no Redis (Estado Atual, Presença e Histórico).
- API HTTP/JSON com Autenticação Básica e Tratamento de Falhas.

### Slide 7: Demonstração ao Vivo
- Execução do teste prático no Web Dashboard em tempo real.
- Acionamento de atuadores e confirmação via ACK.

### Slide 8: Conclusão e Perguntas
- Recapitulação do atendimento de 100% dos requisitos das Etapas 1, 2 e 3.
