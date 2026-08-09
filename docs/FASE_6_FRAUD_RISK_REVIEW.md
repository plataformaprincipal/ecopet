# FASE 6 — Fraud / Risk Review

**Chargebacks reais:** 0 (piloto não aberto).  
**Base:** comportamento sandbox + controles existentes.

## Achados

| Sinal | Observado | Ação mínima próxima fase |
| ----- | --------- | ------------------------ |
| Múltiplos webhooks por order | sim (retry MP) | idempotência (já no pipeline) |
| Pagamentos simulados | bloqueados em Production | manter |
| Amount mismatch | teste negativo OK; recon provider-aware no WT | deploy após commit |
| Bypass URL | risco operacional | rotacionar; não logar secret |
| Contas teste massivas homolog | esperado em E2E | não usar como fraude real |

## Regras mínimas (não auto-ban)

1. Alertar mismatch provider amount > 0.  
2. Alertar signature failure rate.  
3. Revisar manualmente refunds > X% por parceiro (quando houver volume).  
4. Não bloquear cliente sem evidência.

## Veredito risco

Sem volume real → **capacidade de fraude não medida**. Manter controles fail-closed.
