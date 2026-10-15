# Entrega 5 — Persistência de Estado, Histórico e Presença no Redis

Este diretório contém a documentação completa, trechos de código e o arquivo PDF gerado para a **Entrega 5** da disciplina de Internet das Coisas III (IFMG Campus Ouro Branco).

---

## 📄 Arquivos da Entrega

- [Relatório Técnico em PDF](Entrega_5_Persistencia_Redis_Historico_e_Presenca.pdf) — Documento oficial diagramado para submissão.
- [Relatório Técnico em Markdown](Entrega_5_Persistencia_Redis_Historico_e_Presenca.md) — Documento fonte com detalhamento e explicações.
- [Módulo de Armazenamento Chave-Valor Redis](../../backend/src/storage/kv_store.ts)
- [Rotas HTTP REST da API de Histórico e Exportação](../../backend/src/api/routes.ts)
- [Tabela de Histórico com Paginação de 50 Leituras e Filtro](../../frontend/src/components/HistoryTable.tsx)
- [Painel Dashboard React com Timestamp Aferido](../../frontend/src/App.tsx)

---

## 📋 Produtos Esperados (100% Atendidos)

| # | Produto Esperado | Atendimento |
| :-: | :--- | :---: |
| 1 | Gateway conectado ao banco de dados chave-valor Redis (porta 6379) | ✅ Concluído |
| 2 | Definição e documentação detalhada da modelagem de chaves | ✅ Concluído |
| 3 | Persistência do estado atual do dispositivo com data aferida (`recordedAt`) | ✅ Concluído |
| 4 | Persistência do histórico temporal de telemetrias em listas (`LPUSH`/`LTRIM`) | ✅ Concluído |
| 5 | Registro e atualização do último contato ou presença (`lastSeen`) | ✅ Concluído |
| 6 | Consulta do estado atual armazenado via API REST (`GET /api/devices/:id`) | ✅ Concluído |
| 7 | Consulta de registros históricos com paginação a cada 50 leituras e filtro por data | ✅ Concluído |
| 8 | Evidência de dados persistidos comprovada via `redis-cli`, testes e prints | ✅ Concluído |
