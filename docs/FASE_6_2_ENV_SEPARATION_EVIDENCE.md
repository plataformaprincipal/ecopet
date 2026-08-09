# FASE 6.2 — Evidência de separação de envs (sem secrets)

**Data:** 2026-08-09  
**Método:** fingerprints locais (`apps/web/.env.preview.verify` × `.env.production.verify`) + `vercel env ls` (presença/escopo)

## Banco

| | Preview | Production |
| - | ------- | ---------- |
| DATABASE host | `aws-0-sa-east-1.pooler.supabase.com:6543` | `aws-1-sa-east-1.pooler.supabase.com:6543` |
| DATABASE sha8 | `393dd486` | `b8275cf8` |
| DIRECT host | `aws-0-…:5432` | `aws-1-…:5432` |
| Mesmo valor? | **NÃO** | |

```text
DATABASE_ISOLATION_OK_FROM_LOCAL_VERIFY
```

## Mercado Pago (Vercel CLI presença)

| Var | Preview | Production |
| --- | ------- | ---------- |
| ACCESS_TOKEN | presente | **ausente** |
| PUBLIC_KEY | presente | **ausente** |
| WEBHOOK_SECRET | presente | presente |
| ENVIRONMENT | presente (test) | **ausente** |

## URLs / auth

| Achado | Risco |
| ------ | ----- |
| `APP_URL` / `NEXT_PUBLIC_APP_URL` / `NEXTAUTH_URL` / `WEB_URL` no Vercel marcados **Preview, Production** (binding compartilhado) | HIGH — possível homolog em prod |
| Arquivo `.env.production.verify` local **sem** APP_URL/NEXTAUTH (incompleto) | evidência parcial |

## Flags de teste

| Flag | Preview | Production (CLI) |
| ---- | ------- | ---------------- |
| E2E_TEST_MODE / SECRET | presentes | ausentes |
| ALLOW_SIMULATED_PAYMENTS | presente | ausente |
| TURNSTILE_ALLOW_CLOUDFLARE_TEST_KEYS | presente | ausente |

## Veredito env separation

```text
PARCIAL — DB isolado comprovado; MP Production incompleto; URLs shared binding não resolvido
```
