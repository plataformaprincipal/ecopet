# Assistente — Banco

Modelos reutilizados (sem migration nova):

- `AIConversation` — `title`, `metadata` Json `{ pinned, favorite, archived }`
- `AIMessage` — conteúdo + metadata de latência/stream
- `AiSession` — memória janela deslizante (`loadMemory` / `saveMemory`)
- `AIFeedback`, `AIUsage`, `AIAuditLog`

Não criamos `AIPromptLog` / anexos nesta etapa.
