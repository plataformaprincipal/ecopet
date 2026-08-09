# FASE 3.4 — Hardening financeiro — Resultado

**Branch:** `test/fase-3-1-financial-preview`  
**HEAD:** `5afc072`  
**Ambiente:** homolog / Preview / sandbox MP  
**Atualizado:** 2026-08-09

---

## Veredito

```text
FASE 3.4 PARCIALMENTE CONCLUÍDA — CORREÇÕES NECESSÁRIAS
```

---

## Evidências executadas

| Área | Resultado |
| ---- | --------- |
| Invariantes documentados | `docs/FASE_3_4_FINANCIAL_INVARIANTS.md` |
| Unit `test:finance` (+ hardening + recon classify) | **42/42** |
| Homolog DB concurrency (10x same idempotency) | **PASS** (1 insert + 9× P2002) |
| Sem `PAYMENT_RECEIVED` duplicado | **PASS** |
| Refund sum ≤ paid (amostra) | **PASS** |
| APPROVED sem provider IDs | **PASS** (0) |
| Fase 2 homolog | **24/24** |
| Fase 3 homolog | **16/16** (ledger, payout, refund, chargeback, recon, IDOR 403) |
| Amount mismatch bloqueia PAID | **PASS** (Fase 2 `neg_webhook_divergent_amount`) |
| Webhook natural assinatura | **FAIL** (herdado FASE 3.3) |

---

## Matriz (resumo)

1. **Invariantes** — FIN-001…020 definidos  
2. **Webhook concorrente** — unique DB comprovada; natural não processa (assinatura)  
3. **Fora de ordem** — guards em `apply-payment-status` + testes de contrato  
4. **Amount mismatch** — bloqueio `diff > 0.01`  
5. **External reference** — `ecopet_{orderId}` + conflict check provider IDs  
6. **Provider failure** — fail-closed (não assume PAID); natural blocked by sig  
7. **Falhas parciais** — `$transaction` + recovery ledger se PAID sem post  
8. **Refunds** — Fase 3 + amostra DB  
9. **Payouts** — Fase 3 sandbox PAID lógico  
10. **Reserve** — Fase 3 blocked→available  
11. **Chargeback** — INTERNO CONTROLADO (Fase 3)  
12. **Reconciliation** — `RECONCILED` em amostra; **gap**: received = payment.amount  
13. **Restart/serverless** — idempotency no DB (não memória)  
14. **Postgres** — uniques; app usa pooler `DATABASE_URL`  
15. **Autorização** — Fase 3 IDOR 403 client/partner  
16. **Audit** — writeAuditLog em mutações  
17. **Carga** — 10× concorrência key; não 50 pedidos sandbox nesta rodada  
18. **Regressão** — finance + Fase 2/3 OK  

---

## Falhas / gaps

| Severidade | Item |
| ---------- | ---- |
| **CRITICAL** | FASE 3.3: webhook natural `SIGNATURE_MISMATCH` — FIN-001 via canal externo não comprovado |
| **HIGH** | `reconcilePayment` não compara amount do provider (usa `payment.amount` duas vezes) |
| **MEDIUM** | Order/Payment Float vs ledger cents — risco de borda |
| **MEDIUM** | Matriz completa HTTP 2/5/10 webhooks naturais não exercitável enquanto assinatura falha |

---

## Correções nesta fase

- Testes `hardening.test.ts` adicionados a `test:finance`  
- Script `scripts/fase-3-4-financial-hardening.mjs` (DB homolog)  
- Sem mudança Production  

---

## Riscos residuais

1. Piloto dependente de webhook natural continua bloqueado (3.3).  
2. Conciliação provider incompleta.  
3. Patches locais de assinatura webhook não commitados.
