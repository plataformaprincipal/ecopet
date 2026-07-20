# Arquitetura Final — IA EcoPet

```
Client UI (/eccopet)
  → POST /api/ai/chat/stream
    → streamAssistantChat
      → Prompt Firewall + Moderation + Rate Limit
      → buildBusinessContext (modules)
      → runFunctionCallingLoop (enterprise / Responses)
      → enterpriseStream (Responses → Completions fallback)
      → Memory + Summary + Usage + Telemetry sink
```

## Camadas

| Camada | Path | Responsabilidade |
|--------|------|------------------|
| Foundation | `lib/ai/foundation` | Client, health, smoke |
| Assistant | `lib/ai/assistant` | Stream, history, personas |
| Modules | `lib/ai/modules` | Context, tools, memory |
| Enterprise | `lib/ai/enterprise` | FC loop, firewall, costs, exec dashboard |
| Legacy bridge | `tools/registry`, `ai-tools` | Compatibilidade; FC real em modules |

## Princípios

- Singleton OpenAI
- Sem Prisma direto nas tools (services/adapters)
- Barrel `@/lib/ai` marcado `server-only`
- Sem MCP / agents autônomos nesta etapa
