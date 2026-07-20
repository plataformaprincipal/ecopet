# Assistente — Backend

Camada `lib/ai/assistant`:

| Arquivo | Responsabilidade |
|---------|------------------|
| `stream.ts` | Pipeline streaming + persistência |
| `prompts.ts` / `personas.ts` | Prompt builder por perfil |
| `history.ts` | Conversas + metadata |
| `rate-limit.ts` | User + IP |
| `security.ts` | Sanitize |
| `analytics.ts` | Agregados admin |
| `permissions.ts` | ACL módulo eccopet-ai |

Controller: route handlers Next.js. Service: `streamAssistantChat`. Sem Agents SDK / MCP.
