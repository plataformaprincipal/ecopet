# Performance — IA (final)

## Otimizações aplicadas

- Cliente OpenAI singleton
- Responses stream preferencial
- Índices Prisma (`AIMessage`, `AIFeedback`, `AIAuditLog`, `AITokenUsage`)
- Cache in-memory Redis-ready
- Barrel `server-only` (evita bundle client)
- Remoção de dead code (`utils/costs.ts`, `services/index.ts`)
- Load tests simulados 100/500/1000

## Metas operacionais

| Métrica | Alvo |
|---------|------|
| Firewall 100 ops | < 5s |
| Sanitize 500 ops | < 5s |
| Token/cache 1000 ops | < 15s |
| Stream p95 | monitorar no dashboard |

## Próximas

Redis/Upstash, edge cache de catálogo, p95 persistido em série temporal externa.
