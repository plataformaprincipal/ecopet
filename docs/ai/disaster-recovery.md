# Disaster Recovery — IA

## Cenários

| Falha | Mitigação |
|-------|-----------|
| OpenAI indisponível | Fallback Completions; health degraded; UI unavailable banner |
| Rate limit / budget | 429 + circuit breaker (`ai-rate-limit`) |
| Supabase/Prisma down | Stream falha controlada; sem dual-write crítico |
| Cloudinary down | Upload AI opcional; chat segue sem anexo |
| Chave comprometida | Rotacionar `OPENAI_API_KEY`; revogar project key |

## Backup

- Dados IA em Postgres (Supabase) — backup/PITR conforme política DB EcoPet
- Sem dependência de estado efêmero além de cache in-memory

## Rollback

1. Redeploy release anterior Vercel
2. Feature flag `AI_ENABLED=false` / pause
3. Migrations AI são aditivas (índices/tabelas) — rollback de app não exige drop
