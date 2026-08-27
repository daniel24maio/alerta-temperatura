# Entrega 1 - Planejamento e Arquitetura do Projeto IoT

Este diretório contém os **4 produtos esperados** para a **Entrega 1 (Planejamento e Arquitetura do Projeto IoT)** da disciplina de Arquitetura de Soluções de IoT:

---

## 📋 Produtos Esperados e Arquivos Correspondentes

| Produto Esperado | Arquivo no Repositório | Descrição |
| :--- | :--- | :--- |
| **1. Registro Diagnóstico Inicial** | [`REGISTRO_DIAGNOSTICO_INICIAL.md`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/docs/entrega-1/REGISTRO_DIAGNOSTICO_INICIAL.md) | Mapeamento de competências da equipe, nível de conhecimento inicial em IoT, identificação de riscos e ambiente de desenvolvimento. |
| **2. Proposta do Projeto** | [`PROPOSTA_PROJETO.md`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/docs/entrega-1/PROPOSTA_PROJETO.md) | Detalhamento da necessidade ambiental, problema, objetivos gerais/específicos, sensores (DHT22 e Som ADC), atuadores (Display ST7789, Relé/Cooler e LED) e regras ambientais. |
| **3. Diagrama da Arquitetura IoT** | [`DIAGRAMA_ARQUITETURA.md`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/docs/entrega-1/DIAGRAMA_ARQUITETURA.md) | Representação gráfica em Mermaid e diagrama de blocos textuais das 4 camadas IoT (Dispositivos, Rede/Broker MQTT, Gateway Node.js/Redis e Frontend React). |
| **4. Fluxo de Dados e Mensagens** | [`FLUXO_DADOS_E_MENSAGENS.md`](file:///Users/daniel/ifmg/io-sensor/alerta-temperatura/docs/entrega-1/FLUXO_DADOS_E_MENSAGENS.md) | Diagramas de sequência da conexão LWT, telemetria periódica e comando com confirmação ACK, além da especificação de tópicos MQTT e schemas JSON. |

---

## 🛠️ Resumo Técnico dos Componentes

- **Dispositivo Embarcado**: ESP32 programável em **JavaScript (Runtime Espruino)** ou **C++ (PlatformIO)**.
- **Display Local**: Display TFT IPS Colorido ST7789 (2.25" 76x284) via barramento SPI de 8 pinos.
- **Sensores**: DHT22 (Temperatura e Umidade) + Sensor de Som Analógico (ADC1).
- **Atuadores**: Relé / Cooler para circulação de ar + LED / Buzzer de alerta.
- **Broker MQTT**: Eclipse Mosquitto (Porta 1883 TCP / 9001 WebSockets) com QoS 1, Retain e LWT.
- **Gateway Edge**: Node.js + TypeScript com validação Zod e armazenamento chave-valor Redis.
- **Interface Web**: Single Page Application em React 18 + TypeScript + Vite + TailwindCSS + Vitest.
