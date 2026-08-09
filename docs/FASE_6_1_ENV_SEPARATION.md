# FASE 6.1 — Separação Preview × Production

Base: `docs/FASE_4_PRODUCTION_INVENTORY.md` + `vercel env ls`.

| VARIÁVEL | PREVIEW | PRODUCTION | IGUAL? | DIFERENTE? | RISCO |
| -------- | ------- | ---------- | ------ | ---------- | ----- |
| DATABASE_URL | set | set | NÃO | SIM obrigatório | CRITICAL se igual |
| DIRECT_URL | set | set | NÃO | SIM | CRITICAL |
| APP_URL / NEXT_PUBLIC / NEXTAUTH_URL | shared tag | shared tag | **AUDITOR** | SIM (domínios) | HIGH |
| AUTH_SECRET / NEXTAUTH_SECRET | shared tag | shared tag | **AUDITOR** | preferível distinto | HIGH |
| MP_ACCESS_TOKEN | TEST presente | **MISSING** | n/a | SIM | CRITICAL |
| MP_PUBLIC_KEY | TEST presente | **MISSING** | n/a | SIM | CRITICAL |
| MP_WEBHOOK_SECRET | set | set | NÃO | SIM | CRITICAL se TEST=PROD |
| MP_ENVIRONMENT | test | MISSING | n/a | production | CRITICAL |
| E2E_* / TURNSTILE test allow / ALLOW_SIMULATED | Preview | ausente | OK | — | OK |
| FINANCIAL_* | set | unset→off | — | ligar explícito | MEDIUM |
| CHECKOUT_ENABLED | (novo) | (novo) | pode igual | ops | — |
| Vercel bypass | ops Preview | não | — | ausente Prod | OK |

## Garantias

| Regra | Status |
| ----- | ------ |
| Sem TEST key comprovada em Production | **INCOMPLETO** (token ausente ≠ prova de ausência futura errada) |
| Sem E2E em Production | **OK** |
| Sem homolog URL em Production | **NÃO PROVADO** (URLs sensitive/shared) |
| Banco separado | **NÃO PROVADO** sem fingerprint |
| Auth secrets apropriados | **AUDITOR** |

**Ação:** pull/compare fingerprints (sem imprimir valores) + separar vars shared após autorização.
