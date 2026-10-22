# Entrega 6 — Comunicação Bidirecional e Confirmação de Comandos

Este diretório contém a documentação técnica completa, trechos de código-fonte comentados, registros de execução, evidências experimentais e o arquivo PDF oficial diagramado para a **Entrega 6** da disciplina de Internet das Coisas III (IFMG Campus Ouro Branco).

---

## 📄 Arquivos da Entrega

- [Relatório Técnico em PDF](Entrega_6_Comunicacao_Bidirecional_e_Confirmacao.pdf) — Documento oficial diagramado para submissão.
- [Relatório Técnico em Markdown](Entrega_6_Comunicacao_Bidirecional_e_Confirmacao.md) — Documento fonte completo.
- [Serviço MQTT do Gateway (Envio e Recepção)](../../backend/src/mqtt/gateway_mqtt.ts)
- [Callback de Recepção no ESP32](../../firmware/src/main.cpp)
- [Publicação de Confirmação Retida (`.../state`)](../../firmware/src/mqtt_client.cpp)
- [Acionamento Físico de Hardware](../../firmware/src/actuator_manager.cpp)
- [Suíte de Testes Automatizados no Vitest](../../backend/tests/e2e.test.ts)

---

## 📋 Produtos Esperados (100% Atendidos)

| # | Produto Esperado | Atendimento |
| :-: | :--- | :---: |
| 1 | Publicação de comandos pelo gateway via MQTT | ✅ Concluído |
| 2 | Recebimento dos comandos pelo ESP32 | ✅ Concluído |
| 3 | Acionamento remoto do atuador físico (LED GPIO 12 e Relé GPIO 14) | ✅ Concluído |
| 4 | Publicação da confirmação pelo ESP32 após a execução do comando | ✅ Concluído |
| 5 | Recepção da confirmação pelo gateway | ✅ Concluído |
| 6 | Atualização do estado do atuador no Redis | ✅ Concluído |
| 7 | Evidência do fluxo bidirecional completo entre gateway e dispositivo | ✅ Concluído |
| 8 | Evidência de que o estado armazenado corresponde ao estado efetivamente confirmado | ✅ Concluído |
