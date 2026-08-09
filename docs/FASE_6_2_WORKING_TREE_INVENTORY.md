# FASE 6.2 — Working tree inventory

**Branch:** `test/fase-3-1-financial-preview` @ `5afc072`  
**Dirty paths (approx):** ~95

| Classe | Exemplos | Ação |
| ------ | -------- | ---- |
| P0_FIX | webhook-signature, pipeline, route MP webhook | manter |
| P1_FIX | checkout-flags, financial-alerts, reconciliation*, UX sucesso, env-registry | manter |
| TEST | mercado-pago.test, reconciliation.test, checkout-flags.test, hardening.test | manter |
| DOC | docs/FASE_3–6.2*, FINANCIAL_*, PRODUCTION_*, runbooks, pilot/ | manter |
| TOOLING | check-production-environment.mjs, fase-3-4-financial-hardening.mjs | manter |
| TEMP | `_tmp-inspect-latest-sig.mjs`, `_tmp-env-fp-compare.mjs`, logs | remover após evidência |
| TEMP ops | `_tmp-deploy-preview*`, `_tmp-fase-3-3-natural-watch*` | manter até P0 fechado (prova) |
| UNRELATED | — | — |

Secrets: nenhum `.env*` staged.
