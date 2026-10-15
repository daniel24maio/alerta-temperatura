# Entrega 4 — Gateway MQTT e Processamento de Mensagens

Este diretório contém a documentação completa, trechos de código e o arquivo PDF gerado para a **Entrega 4** da disciplina de Internet das Coisas III (IFMG Campus Ouro Branco).

---

## 📄 Arquivos da Entrega

- [Relatório Técnico em PDF](Entrega_4_Gateway_MQTT_e_Processamento.pdf) — Documento oficial diagramado para submissão.
- [Relatório Técnico em Markdown](Entrega_4_Gateway_MQTT_e_Processamento.md) — Documento fonte com detalhamento e explicações.
- [Código-fonte do Serviço Gateway MQTT (TypeScript)](../../backend/src/mqtt/gateway_mqtt.ts)
- [Schemas de Validação Zod](../../backend/src/validators/schemas.ts)
- [Suíte de Testes Automatizados (Vitest)](../../backend/tests/e2e.test.ts)

---

## 📋 Produtos Esperados (100% Atendidos)

| # | Produto Esperado | Atendimento |
| :-: | :--- | :---: |
| 1 | Gateway em Node.js conectado ao broker MQTT com reconexão automática | ✅ Concluído |
| 2 | Assinatura dos tópicos padronizados com wildcards | ✅ Concluído |
| 3 | Recepção assíncrona contínua das mensagens de telemetria | ✅ Concluído |
| 4 | Identificação automática do dispositivo pelo tópico | ✅ Concluído |
| 5 | Interpretação e validação estrita de JSON usando schemas Zod | ✅ Concluído |
| 6 | Registro de mensagens válidas e diagnósticos de mensagens inválidas | ✅ Concluído |
| 7 | Evidência de processamento comprovada via testes automatizados no Vitest | ✅ Concluído |
