# Assistente Virtual EcoPet

Produto: `/eccopet` (`EccoPetAIShell`) — **não** um segundo chat paralelo.

## Módulo

`apps/web/src/lib/ai/assistant/*`

- Personas CLIENT / PARTNER / ONG / ADMIN
- Prompts por persona + conhecimento de navegação da plataforma
- Streaming SSE (`streamAssistantChat`)
- Histórico: list/search/pin/favorite/rename/archive via `metadata` Json
- Rate limit user + IP
- Sanitização de input
- Analytics agregadas (admin)

## APIs

| Endpoint | Função |
|----------|--------|
| `POST /api/ai/chat/stream` | SSE do assistente |
| `POST /api/ai/chat` | Fallback não-streaming |
| `GET/POST /api/ai/conversations` | Lista (+ `?q=`) / cria |
| `PATCH /api/ai/conversations/[id]` | title / pinned / favorite / archived |
| `GET /api/admin/ai/assistant` | Métricas + health |

## Fundação

Reutiliza `getOpenAIClient`, orchestrator patterns, memory, moderation. Não reimplementa Prompt 1.
