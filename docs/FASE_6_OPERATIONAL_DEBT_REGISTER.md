# FASE 6 — Operational / financial / security debt

## Operacional

| Item | Nota |
| ---- | ---- |
| Dependência de fundador/ops para secret MP | bus factor |
| Dry-run nunca executado | processo não ensaiado |
| Bypass na URL webhook | procedimento frágil |
| Owners TBD em vários runbooks | accountability |

## Financeira

| Item | Nota |
| ---- | ---- |
| Payout 100% manual (desejável no início) | dívida aceitável |
| Recon provider-aware não em Production | |
| Tax mapping / export contábil | não fechado |
| Cash/reserve operacional não dimensionados (sem GMV) | |

## Segurança

| Item | Sev | Status |
| ---- | --- | ------ |
| Webhook signature mismatch | Critical | ABERTO |
| Bypass secret em URL | High | ABERTO |
| Shared auth secrets Preview+Prod (suspeita) | High | AUDITAR |
| Critical aberto → **bloqueia Fase 7** | — | — |
