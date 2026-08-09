# FASE 6.2 — Resultado

**Data:** 2026-08-09  
**HEAD:** `5afc072`  
**Production / merge / commit / cobrança real:** não

---

## Veredito

```text
FASE 6.2 BLOQUEADA — WEBHOOK AINDA INVÁLIDO
```

```text
RECOMENDAÇÃO FASE 7: BLOQUEAR
```

---

## A — Webhook P0

- Classificação: **PROVIDER/APP SECRET MISMATCH**  
- `secretSha8` runtime/local: `bfcd6920` (inalterado)  
- HMAC não alterado nesta fase  
- Dry-run / regressão completa pós-P0: **não** (gate)

## B — MP Production

**BLOCKED** (token/key/environment ausentes)

## C — Env separation

- DB Preview ≠ Production: **comprovado** (hosts aws-0 vs aws-1; sha8 distintos)  
- URLs shared binding Vercel: **ainda risco**  
- E2E/simulado só Preview: OK na CLI

## D — Backup

P1 aberto — restore isolado não executado

## E — Bypass URL

Plano Production documentado (`FASE_6_2_BYPASS_URL_PLAN.md`) — bypass permanece só homolog

## F — Working tree

Inventariado; patches P0/P1/DOC mantidos; sem commit

## G/H — Regressão / dry-run

Não executados (P0 aberto)
