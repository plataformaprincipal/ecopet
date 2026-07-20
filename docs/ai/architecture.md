# Arquitetura IA — Fundação EcoPet

## Princípio

A fundação **reutiliza** `apps/web/src/lib/ai/*` (singleton OpenAI, provider, orchestrator, rate limit, audit).  
Esta etapa **não** implementa assistente completo, agentes de domínio, RAG operacional nem marketplace IA novos.

## Camadas

```
Admin / Hooks
    ↓
/api/admin/ai/foundation  (RBAC ADMIN + rate limit)
    ↓
lib/ai/foundation/*       (status, health, diagnostics, smoke)
    ↓
lib/ai/openai-client.ts   (singleton)
lib/ai/openai-provider.ts (generate + sanitize + retry)
lib/ai/ai-config.ts       (env central)
```

## Pacotes novos (fundação)

| Path | Função |
|------|--------|
| `lib/ai/foundation/` | Status / health / diagnostics / smoke |
| `lib/ai/utils/retry.ts` | Retry exponencial recuperável |
| `lib/ai/utils/sanitize-input.ts` | Redação PII em texto livre |
| `lib/ai/utils/prompt-builder.ts` | Builder modular (sem concat em UI) |
| `lib/ai/utils/response-parser.ts` | Preview seguro |
| `lib/ai/services/index.ts` | Facades |
| `hooks/use-ai.ts` / `use-ai-health.ts` | Client hooks admin |
| `/admin/ai/foundation` | Painel Visão Geral → Testes |

## Não duplicar

- **Nunca** `new OpenAI()` no web fora de `getOpenAIClient()`.
- `apps/api` ainda tem clientes ad-hoc — consolidação futura, fora do escopo.

## Banco

Modelos Prisma AI já existem (`AIUsage`, `AIAuditLog`, …). **Não** criamos `AIConfiguration` nesta etapa (config = env).

## Próximas etapas (fora desta entrega)

1. Assistente virtual completo  
2. Recomendações / agentes de domínio  
3. Embeddings/RAG operacional  
4. Streaming UX avançado / function calling / MCP  
