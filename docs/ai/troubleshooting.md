# Troubleshooting IA (final)

| Sintoma | Ação |
|---------|------|
| `AI_NOT_CONFIGURED` / 503 | `OPENAI_API_KEY` + `AI_ENABLED` ≠ false; redeploy |
| `AI_FIREWALL_BLOCK` | Entrada com injection/secrets — legítimo |
| 429 rate/budget | Aguardar; revisar `AI_*_BUDGET` e limites |
| Health `not_configured` | Key ausente ou `OPENAI_PAUSED=1` |
| Health unhealthy | Rede/billing OpenAI; `OPENAI_PROJECT_ID` |
| Stream cai no fallback chat | Responses stream falhou — Completions ativo |
| Tools sem dados | Verificar permissões persona + services |
| Upload AI falha | Cloudinary + purpose `ai_attachment` |
| Dashboard vazio | Sem `AIUsage` ainda; gerar tráfego autenticado |
| `server-only` no client | Não importar `@/lib/ai` em Client Components |

## Logs

Não buscar prompt completo — por design. Usar `AIAuditLog`, `AISecurityEvent`, `AIToolExecution`, `AIUsage`.

## Docs relacionadas

`production-checklist.md`, `operations.md`, `security-final.md`, `disaster-recovery.md`.
