# Registro Diagnóstico Inicial - Entrega 1

**Disciplina**: Arquitetura de Soluções de Internet das Coisas (IoT)  
**Projeto**: Sistema de Alerta de Temperatura e Saúde Ambiental IoT  
**Equipe**: [Nome dos Alunos / Estudante]  

---

## 1. Apresentação e Contexto do Diagnóstico

Este registro diagnóstico inicial mapeia as competências, conhecimentos prévios, lacunas de aprendizado e a estrutura de ferramentas necessárias para o desenvolvimento do projeto **"Alerta de Temperatura e Saúde Ambiental IoT"**.

A solução proposta visa integrar dispositivos embarcados (ESP32), protocolo de comunicação leve de alto desempenho (MQTT), backend de processamento de eventos (Node.js + TypeScript), banco de dados chave-valor (Redis) e uma interface web moderna de monitoramento (React + TailwindCSS).

---

## 2. Matriz de Conhecimento e Diagnóstico da Equipe

| Domínio Tecnológico | Nível Inicial | Conhecimentos Prévios | Oportunidades de Aprendizado e Desafios |
| :--- | :---: | :--- | :--- |
| **Microcontroladores & Embarcados** | Intermediário | Lógica de programação C/C++, pinagem básica de placas Arduino. | Aprendizado de programação do **ESP32** em C++ (PlatformIO) e em **JavaScript (Runtime Espruino)**; uso do barramento **SPI de 8 pinos** para o Display TFT ST7789 IPS. |
| **Sensoriamento & Atuação** | Básico/Intermediário | Leitura de sensores analógicos e digitais simples. | Leitura combinada de **Temperatura/Umidade (DHT22)** e amostragem analógica **ADC (Sensor de Som)** com aplicação de limiares dinâmicos de alerta. |
| **Redes e Protocolos IoT** | Intermediário | Redes Wi-Fi, requisições HTTP REST convencionais. | Protocolo **MQTT**: diferenciação entre QoS 0/1/2, mensagens com retenção (*Retain*), contratos de **Last Will and Testament (LWT)** e reconexão resiliente. |
| **Backend & Processamento Edge** | Avançado | JavaScript/TypeScript, APIs REST em Node.js. | Integração de clientes MQTT com subscrição de tópicos *wildcard* (`+`), validação estrita de contratos JSON com **Zod** e persistência em banco chave-valor **Redis**. |
| **Frontend & Interface Web** | Avançado | HTML, CSS, React, consumo de APIs. | Construção de Dashboard SPA em **React 18 + TailwindCSS**, incluindo simulador gráfico em tempo real do Display ST7789 IPS e testes automatizados com **Vitest**. |
| **Infraestrutura & DevOps** | Intermediário | Utilização básica do Docker. | Orquestração da stack completa (`mosquitto`, `redis`, `backend`, `frontend`) via **Docker Compose** e deploy em 1 clique via **Portainer Stack**. |

---

## 3. Identificação de Riscos e Planos de Mitigação

1. **Risco 1: Indisponibilidade de Hardware Físico no Momento de Testes**
   - *Mitigação*: Desenvolvimento de um **Simulador ESP32 Interativo em Node.js** (`backend/tests/simulator.ts`) e em **JavaScript Espruino**, capaz de simular todas as leituras de sensores, envio de telemetria MQTT e disparo de mensagens ACK sem depender da placa física.
2. **Risco 2: Perda de Conexão Wi-Fi ou Queda do Broker MQTT**
   - *Mitigação*: Implementação de loops de reconexão não-bloqueantes no firmware do ESP32 e configuração de **Last Will and Testament (LWT)** para que o Gateway identifique imediatamente quando o nó ficar `offline`.
3. **Risco 3: Falha no Envio de Comandos aos Atuadores**
   - *Mitigação*: Exigência de mensagem de confirmação **ACK** publicada pelo ESP32 no tópico `v1/devices/{deviceId}/commands/ack` com timeout de 5 segundos no Gateway (retornando HTTP 504 em caso de ausência de resposta).

---

## 4. Ambiente de Desenvolvimento Configurado

- **IDE Principal**: Visual Studio Code com extensões PlatformIO, TailwindCSS IntelliSense e Vitest Explorer.
- **Ambiente de Testes**: Vitest (Backend e Frontend), simulador Node.js e Docker Compose local.
- **Gerenciador de Repositório**: Git em estrutura de **Mono-Repositório**.
