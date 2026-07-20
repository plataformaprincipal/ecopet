# Configuração IA

## Variáveis

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `OPENAI_API_KEY` | Sim (para operar) | Secret server-only |
| `OPENAI_PROJECT_ID` | Opcional | Scoping de projeto OpenAI |
| `AI_ENABLED` | Não | Default on se ≠ `false` |
| `OPENAI_PAUSED` | Não | `1` pausa a IA |
| `OPENAI_MODEL` | Não | Default `gpt-4o-mini` |
| `OPENAI_EMBEDDING_MODEL` | Não | Default `text-embedding-3-small` |
| `OPENAI_MODERATION_MODEL` | Não | Default `omni-moderation-latest` |
| `OPENAI_MAX_OUTPUT_TOKENS` | Não | Default 1024 |
| `OPENAI_REQUEST_TIMEOUT_MS` | Não | Default 30000 |
| `OPENAI_MAX_RETRIES` | Não | Default 3 |
| `OPENAI_RETRY_BASE_MS` | Não | Default 400 |
| `OPENAI_DAILY_USER_LIMIT` | Não | Default 50 |
| `OPENAI_MONTHLY_BUDGET_CENTS` | Não | Default 5000 |

Fonte de código: `apps/web/src/lib/ai/ai-config.ts`.

## Cliente

```ts
import { getOpenAIClient } from "@/lib/ai";
const client = getOpenAIClient(); // singleton + timeout + project
```

## Painel

`/admin/ai/foundation` — mascara key/project; não edita secrets.
