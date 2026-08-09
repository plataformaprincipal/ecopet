# Runbook — Operações de piloto fechado

> Só aplicável após PILOTO FECHADO AUTORIZADO. Estado atual: **piloto bloqueado** (webhook 3.3).

## Abertura do dia
1. Health homolog/prod-alvo do piloto.
2. MP environment=test (ou prod só quando autorizado em fase futura).
3. Webhook: taxa de `signatureValid=true` / rejects.
4. Filas de recon MANUAL_REVIEW.

## Durante o dia
- Pedidos / pagamentos / refunds
- Tickets suporte
- Alertas Better Stack
- Não aprovar payout sem dual control

## Fechamento
1. Reconciliation run
2. Contagem GMV vs ledger platform revenue
3. Lista exceptions
4. Backup confirmation (provedor)

## Kill switches (flags Preview)
- `ALLOW_SIMULATED_PAYMENTS=false` (manter)
- `PAYOUTS_ENABLED`
- `FINANCIAL_LEDGER_ENABLED` (emergência — impacto alto)
- `CHARGEBACKS_ENABLED`
- Deployment Protection / pausar alias se necessário
