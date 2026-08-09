# FASE 6.1 — Alertas P0 implementação

## Mecanismo

`apps/web/src/lib/finance/financial-alerts.ts` → `emitFinancialAlert`

Canais (sem tool externa obrigatória):

1. **Log estruturado** (`logStructured`) → Better Stack se token configurado  
2. **IntegrationLog** `finance_alerts`  
3. **AuditLog** (`action=SYNC`, `resource=financial_alert`)  
4. **Security event** para signature / double-spend  

## Wiring

| Alerta | Onde |
| ------ | ---- |
| WEBHOOK_SIGNATURE_FAILURE | `webhooks/pipeline.ts` em assinatura inválida |
| PROVIDER_AMOUNT_MISMATCH | `reconciliation.ts` status VALUE_MISMATCH |
| LEDGER_POST_FAILURE | recon MISSING_LEDGER |
| RECONCILIATION_MISMATCH | demais status ≠ RECONCILED |

## Ainda não wired (código pronto para chamar)

- PROVIDER_5XX  
- DB_UNAVAILABLE  
- PAYOUT_DOUBLE_SPEND  
- UNEXPECTED_NEGATIVE_BALANCE  

## Comprovação

Após reject de webhook: IntegrationLog + AuditLog com `alert:WEBHOOK_SIGNATURE_FAILURE` / `financial_alert` (sem secret/HMAC completo).
