# Production Alert Matrix

Complementa `docs/FINANCIAL_ALERTING_POLICY.md`.

| SEV | Metric / condição | Threshold piloto | Owner | Action | Runbook |
| --- | ----------------- | ---------------- | ----- | ------ | ------- |
| **P0** | double payment / same charge | > 0 | Fin | freeze payments+payouts | FINANCIAL_INCIDENT |
| **P0** | duplicate ledger `PAYMENT_RECEIVED` | > 0 | Fin | freeze + reconcile | FINANCIAL_INCIDENT |
| **P0** | payout double-spend | > 0 | Fin | freeze payouts | FINANCIAL_INCIDENT |
| **P0** | provider amount mismatch | > 0 | Fin | MANUAL_REVIEW | FINANCIAL_INCIDENT |
| **P0** | DB unavailable | health ready fail > 2m | SRE | incident | PRODUCTION_DATABASE_RECOVERY |
| **P0** | webhook signature failure rate | > 5% / 15m ou > 3 abs | Sec/Fin | investigar secret/MP | SECURITY + FASE_3_3 |
| **P1** | webhook failure / 5xx handler | > 10 / 15m | Eng | retry/MP panel | FINANCIAL_INCIDENT |
| **P1** | reconciliation mismatch aberto | > 0 não revisado 24h | Fin | review | FINANCIAL_INCIDENT |
| **P1** | refund failure | > 0 crítico | Fin | manual refund path | FINANCIAL_INCIDENT |
| **P1** | payout failure | > 0 | Fin | hold | FINANCIAL_INCIDENT |
| **P1** | provider 5xx | > 5 / 15m | Eng | degrade checkout | PILOT_OPERATIONS |
| **P2** | latency p95 API | > 3s | Eng | profile | monitoring |
| **P2** | elevated 429 | > baseline×3 | Eng | tune limits | security |
| **P2** | abnormal refund rate | > 20% pedidos dia | Fin | review fraude | FINANCIAL_INCIDENT |
| **P2** | negative partner balance inesperado | > 0 | Fin | investigate | FINANCIAL_INCIDENT |

### Telemetria mínima

HTTP 5xx · payment failure · webhook failure · signature failure · provider latency/5xx · ledger failures · refund/payout failures · reconciliation mismatch · auth anomalies · rate-limit spikes.

### Ferramenta

Better Stack vars presentes em Production. Binding de alertas **ainda não comprovado E2E** nesta fase — política pronta; wiring = pendência operacional.
