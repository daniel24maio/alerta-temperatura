# Entrega 3 — Comunicação MQTT e Controle Remoto

Este diretório contém a documentação completa, trechos de código e o arquivo PDF gerado para a **Entrega 3** da disciplina de Internet das Coisas III (IFMG Campus Ouro Branco).

---

## 📄 Arquivos da Entrega

- [Relatório Técnico em PDF](Entrega_3_Comunicacao_MQTT_e_Controle_Remoto.pdf) — Documento oficial diagramado para submissão.
- [Relatório Técnico em Markdown](Entrega_3_Comunicacao_MQTT_e_Controle_Remoto.md) — Documento fonte com detalhamento e explicações.
- [Código-fonte do Cliente MQTT (Firmware)](../../firmware/src/mqtt_client.cpp)
- [Código-fonte do Callback de Comandos](../../firmware/src/main.cpp)
- [Controle do Atuador Físico (LED/Relé)](../../firmware/src/actuator_manager.cpp)
- [Plano de Tópicos e Mensagens](../../docs/TOPICS_AND_MESSAGES.md)

---

## 📋 Produtos Esperados (100% Atendidos)

| # | Produto Esperado | Atendimento |
| :-: | :--- | :---: |
| 1 | Conexão do ESP32 ao broker MQTT com credenciais e LWT | ✅ Concluído |
| 2 | Plano de tópicos e estrutura de mensagens conforme padrão IFMG | ✅ Concluído |
| 3 | Publicação periódica de dados de sensores (telemetria canônica) | ✅ Concluído |
| 4 | Recebimento e processamento de comandos via MQTT | ✅ Concluído |
| 5 | Acionamento físico do atuador por comando remoto | ✅ Concluído |
| 6 | Evidência da comunicação bidirecional com retain no tópico de estado | ✅ Concluído |
