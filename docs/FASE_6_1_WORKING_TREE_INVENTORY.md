# FASE 6.1 — Working tree inventory

**Branch:** `test/fase-3-1-financial-preview` @ `5afc072`  
**Data:** 2026-08-09

| Path | Class | Keep? |
| ---- | ----- | ----- |
| `apps/web/src/lib/mercado-pago/webhook-signature.ts` | P0_FIX | SIM |
| `apps/web/src/lib/mercado-pago/webhooks/pipeline.ts` | P0_FIX | SIM |
| `apps/web/src/lib/mercado-pago/webhooks/verify-signature.ts` | P0_FIX | SIM |
| `apps/web/src/app/api/webhooks/mercado-pago/route.ts` | P0_FIX | SIM |
| `apps/web/src/lib/mercado-pago/mercado-pago.test.ts` | TEST | SIM |
| `apps/web/src/lib/finance/reconciliation.ts` | P1_FIX | SIM |
| `apps/web/src/lib/finance/reconciliation-classify.ts` | P1_FIX | SIM |
| `apps/web/src/lib/finance/reconciliation.test.ts` | TEST | SIM |
| `apps/web/src/lib/finance/hardening.test.ts` | TEST | SIM |
| `apps/web/src/lib/finance/financial-alerts.ts` | P1_FIX | SIM |
| `apps/web/src/lib/commerce/checkout-flags.ts` (+ test) | P1_FIX | SIM |
| `apps/web/src/lib/orders/checkout-service.ts` | P1_FIX | SIM |
| `apps/web/src/app/api/checkout/route.ts` | P1_FIX | SIM |
| `apps/web/src/app/api/checkout/mercado-pago/order/route.ts` | P1_FIX | SIM |
| `apps/web/src/app/(app)/checkout/sucesso/[orderId]/page.tsx` | P1_FIX | SIM |
| `apps/web/src/lib/env-registry.ts` | P1_FIX | SIM |
| `apps/web/package.json` / root `package.json` | TEST/DOC tooling | SIM |
| `scripts/check-production-environment.mjs` | P1_FIX | SIM |
| `scripts/fase-3-4-financial-hardening.mjs` (+ result json) | TEST | SIM (result json opcional) |
| `scripts/_tmp-*` | TEMP | restaurados só para prova P0; remoção após |
| `docs/FASE_3_*` … `FASE_6_*` / runbooks / FINANCIAL_* | DOC | SIM |
| Deletions `_tmp-*` prévias | TEMP cleanup | OK |

**Secrets:** nenhum `.env*` no índice.
