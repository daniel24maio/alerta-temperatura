# Alerta de Temperatura e Saúde Ambiental IoT (React + Node.js + ESP32 JS)

Solução IoT completa desenvolvida para atendimento integral dos requisitos das **Etapas 1, 2 e 3** da disciplina de Arquitetura de Soluções de IoT.

---

## 🛠️ Tech Stack da Solução

- **Frontend (`/frontend`)**: **React 18 + TypeScript + Vite + TailwindCSS + Vitest** (Dashboard SPA responsivo em Dark Mode com simulador do Display ST7789 IPS 2.25", gauges, controle de atuador e histórico).
- **Backend Gateway (`/backend`)**: **Node.js + TypeScript** (Express REST API com Autenticação Básica, Zod Validator, Cliente MQTT com wildcards e Banco Chave-Valor Redis).
- **Firmware ESP32 (`/firmware`)**: Programação em **JavaScript (Node.js style via Espruino Runtime)** em `firmware/espruino/main.js` e alternativa em C++/PlatformIO.
- **Broker & Banco**: Eclipse Mosquitto MQTT & Redis.
- **Infraestrutura**: Containerização via **Docker Compose** e deploy simplificado como **Portainer Stack**.

---

## 📁 Estrutura do Mono-Repositório

- **`/docs`**: Documentação técnica detalhada (`ARCHITECTURE.md`, `CIRCUIT_SCHEMATIC.md`, `TOPICS_AND_MESSAGES.md`, `API_DOCUMENTATION.md`, `PORTAINER_DEPLOY.md`, `SETUP_AND_DEMO.md`, `PRESENTATION.md`).
- **`/firmware`**: Código JavaScript (`espruino/main.js`) e C++ para o ESP32.
- **`/backend`**: Gateway Node.js com TypeScript e suíte de testes Vitest.
- **`/frontend`**: Dashboard SPA em React + TailwindCSS + Vite + Vitest.
- **`docker-compose.yml`**: Stack completa para Portainer ou Docker Compose local.

---

## ⚡ Como Executar Localmente com Docker

1. **Inicie todos os containers (Mosquitto, Redis, Backend e Frontend)**:
   ```bash
   docker compose up -d
   ```
2. **Acesse a Aplicação React**:
   - Frontend React: `http://localhost:3000`
   - Backend API REST: `http://localhost:5000/api`
3. **Executar Simulador ESP32**:
   ```bash
   cd backend
   npx ts-node tests/simulator.ts
   ```