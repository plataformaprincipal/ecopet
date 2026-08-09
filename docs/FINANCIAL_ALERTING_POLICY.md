# Política de alertas financeiros (Preview / Piloto futuro)

## CRITICAL

| Metric | Threshold | Owner | Action | Runbook |
| ------ | --------- | ----- | ------ | ------- |
| ledger_post_failure | > 0 / 15m | Finance eng | Congelar checkouts se persistir; investigar AuditLog | FINANCIAL_INCIDENT |
| double_payout_detected | > 0 | Finance eng | PAYOUTS_ENABLED=false; auditar PartnerPayout | FINANCIAL_INCIDENT |
| reconciliation_mismatch_unreviewed | > 0 abertos > 1h | Controller | Fila MANUAL_REVIEW | FINANCIAL_INCIDENT |
| webhook_signature_failure_rate | > 20% de POSTs webhook / 15m **ou** > 5 falhas consecutivas | Ops/MP | Verificar secret Preview vs painel; não desativar HMAC | FINANCIAL_INCIDENT / SECURITY |
| provider_amount_mismatch | > 0 VALUE_MISMATCH / 1h | Finance eng | Não forçar PAID; abrir MANUAL_REVIEW | FINANCIAL_INCIDENT |

## HIGH

| Metric | Threshold | Owner | Action |
| ------ | --------- | ----- | ------ |
| webhook_failure_rate | > 10% / 30m | Ops | Logs Vercel + MpWebhookEvent |
| payout_failure | > 0 FAILED / 1h | Finance | Retry idempotente; dual approval |
| negative_partner_balance_unexpected | qualquer | Finance | Bloquear payouts parceiro |
| provider_5xx | > 5 / 15m | Ops | Kill switch pagamentos se prolongado |

## MEDIUM

| Metric | Threshold | Owner | Action |
| ------ | --------- | ----- | ------ |
| refund_spike | > 5 refunds / 1h em piloto | Support | Revisar fraude |
| api_latency_p95_checkout | > 5s / 15m | SRE | Scale/cold start |
| webhook_retry_spike | > 20 retries / 1h | Ops | Assinatura/entrega |

## Integração

Política auditável mesmo sem ferramenta externa. Em Preview, Better Stack já recebe logs (`webhook.mercado_pago.rejected`, `payment_webhooks`). Thresholds devem ser configurados no provedor de alertas antes do piloto.
