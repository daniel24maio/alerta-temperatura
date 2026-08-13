# Guia de Montagem, Testes E2E e Demonstração Prática

Este manual descreve o passo a passo para executar o projeto, rodar os testes automatizados e realizar a demonstração prática da solução (com ou sem hardware físico).

---

## 1. Execução Local dos Serviços (Docker)

1. Na raiz do repositório, inicie os containers:
   ```bash
   docker compose up -d
   ```
2. Verifique o status dos serviços:
   ```bash
   docker compose ps
   ```
   Os containers `iot-mosquitto`, `iot-redis` e `iot-gateway` devem estar no estado `Up`.

---

## 2. Execução dos Testes Ponta a Ponta (E2E)

No diretório `gateway/`:
```bash
cd gateway
npm install
npm test
```
A suíte de testes validará:
- Parsing e rejeição de JSONs incorretos via Zod.
- Gravação do estado e histórico no banco chave-valor.
- Envio de comandos com confirmação ACK.
- Mensagem de desconexão repentina (LWT).

---

## 3. Roteiro de Demonstração Prática (Via Simulador ESP32)

Se você não tiver o hardware ESP32 físico conectado no momento da apresentação, utilize o **Simulador Interativo Node.js**:

1. Mantenha os serviços rodando (`docker compose up -d`).
2. Abra o Web Dashboard no seu navegador: `http://localhost:3000`.
3. Em outro terminal, execute o simulador:
   ```bash
   cd gateway
   npx ts-node tests/simulator.ts
   ```
4. **Cenários a Demonstrar**:
   - **Cenário 1 (Presença)**: Observe o dispositivo `esp32-temp-01` aparecendo instantaneamente como `online` no Dashboard com horário de `lastSeen`.
   - **Cenário 2 (Alerta de Temperatura > 30°C)**: Altere o valor de temperatura no simulador para 33°C. Observe o "Simulador de Tela ST7789" no Dashboard exibir `ALERTA: Temp >30C! Beba agua & ar em circulacao`.
   - **Cenário 3 (Alerta de Ruído Sonoro)**: Altere o nível de ruído para 78 dB. Observe o indicador de som mudar para vermelho e exibir o alerta de silêncio no local.
   - **Cenário 4 (Controle de Atuador com ACK)**: No Dashboard, clique no botão **Alternar Atuador**. Observe o envio do comando MQTT, a resposta instantânea de ACK do simulador e a mudança de estado na tela.
   - **Cenário 5 (Desconexão LWT)**: Pressione `Ctrl+C` no simulador. Observe a mensagem LWT ser recebida e a badge do dispositivo no Dashboard alterar para `offline`.
