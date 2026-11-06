# Entrega 7 — API REST em Node.js, Consultas ao Redis e Tratamento de Erros HTTP

Este diretório contém a documentação técnica completa, especificação de endpoints HTTP/JSON, trechos de código-fonte comentados, evidências de consultas e tratamento de erros e o arquivo PDF oficial diagramado para a **Entrega 7** da disciplina de Internet das Coisas III (IFMG Campus Ouro Branco).

---

## 📄 Arquivos da Entrega

- [Relatório Técnico em PDF](Entrega_7_API_REST_Consultas_e_Erros_HTTP.pdf) — Documento oficial diagramado para submissão.
- [Relatório Técnico em Markdown](Entrega_7_API_REST_Consultas_e_Erros_HTTP.md) — Documento fonte completo.
- [Rotas da API REST Express](../../backend/src/api/routes.ts)
- [Middleware Global de Tratamento de Erros HTTP](../../backend/src/middleware/error_handler.ts)
- [Middleware de Autenticação Básica (HTTP Basic Auth)](../../backend/src/middleware/auth.ts)
- [Integração Chave-Valor com o Redis](../../backend/src/storage/kv_store.ts)
- [Suíte de Testes Automatizados no Vitest](../../backend/tests/e2e.test.ts)

---

## 📋 Produtos Esperados (100% Atendidos)

| # | Produto Esperado | Atendimento |
| :-: | :--- | :---: |
| 1 | API desenvolvida em Node.js | ✅ Concluído |
| 2 | Endpoint para consulta do estado atual (`/api/devices/:id` e `/api/devices/:id/state`) | ✅ Concluído |
| 3 | Endpoint para consulta do histórico (`/api/devices/:id/history`) | ✅ Concluído |
| 4 | Endpoint para consulta de presença ou último contato (`/api/devices/:id/presence`) | ✅ Concluído |
| 5 | Respostas estruturadas em JSON | ✅ Concluído |
| 6 | Tratamento básico de erros e códigos HTTP (`200`, `400`, `401`, `404`, `503`, `504`, `500`) | ✅ Concluído |
| 7 | Integração entre API e Redis | ✅ Concluído |
| 8 | Evidência das consultas funcionando corretamente | ✅ Concluído |

