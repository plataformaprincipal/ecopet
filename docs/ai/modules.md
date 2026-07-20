# IA de Negócio — Módulos EcoPet

Camada aplicada em `apps/web/src/lib/ai/modules/` **sobre** a fundação OpenAI (Prompt 1) e o Assistente Virtual (Prompt 2).

## Princípios

- Não reimplementa cliente OpenAI / health / diagnostics da fundação.
- Não substitui regras de negócio.
- Ferramentas **não** acessam Prisma diretamente — usam services/adaptadores (`modules/services/domain-reads.ts`).
- Sem MCP, Agents SDK, embeddings obrigatórios ou banco vetorial.

## Módulos

`marketplace`, `mypet`, `agenda`, `partners`, `ngo`, `social`, `profile`, `notifications`, `maps`, `admin`, `orders`, `cart`, `support`, `general`.

## Fluxo no stream

1. Sanitização + moderação + rate limit (user/IP/sessão/perfil)
2. `buildBusinessContext` → intent + tools + memória + prompt de módulo
3. Streaming via provider existente
4. `updateConversationSummary` (resumo extrativo)
5. Audit + usage com `toolsUsed` / módulo

## Admin

- `/admin/ai/modules` — catálogo de ferramentas, FC prep, memória, RAG stub
- API: `GET /api/admin/ai/assistant` inclui `business`
