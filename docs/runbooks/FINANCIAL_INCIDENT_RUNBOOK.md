# Runbook — Incidentes financeiros (Preview / Piloto futuro)

## Princípios
- Fail-closed: não forçar PAID sem provider.
- Não desativar assinatura webhook.
- Não usar Production neste runbook até fases posteriores.

## MP offline / 5xx
1. Confirmar `/api/health` e status MP.
2. Pausar novos checkouts se prolongado (kill switch pagamentos).
3. Não reconciliar manualmente como PAID.
4. Registrar incidente + correlation IDs.

## Webhook offline / SIGNATURE_MISMATCH
1. Verificar logs: `SIGNATURE_MISMATCH` vs `TIMESTAMP_SKEW` vs Vercel Protected.
2. Confirmar secret Preview da **mesma app** TEST (sem usar `env pull` como valor).
3. Redeploy Preview após correção de env.
4. Não aceitar polling como substituto permanente.

## Ledger mismatch
1. Rodar `reconcilePayment` / recon diária.
2. Status `VALUE_MISMATCH` / `MISSING_LEDGER` → MANUAL_REVIEW.
3. Não apagar entries; adjustment com reason + audit.

## Refund falhando
1. Verificar status MP sandbox + `PaymentRefund`.
2. Retry com mesma idempotency key.
3. Se provider OK e DB falhou → recovery ledger refund.

## Payout divergente
1. Congelar novos payouts (`PAYOUTS_ENABLED=false` Preview).
2. Conferir saldo AVAILABLE vs reserved.
3. Dual approval obrigatório.

## Partner balance negativo
1. Bloquear payouts do parceiro.
2. Abrir chargeback/reserve review.
3. Compensação futura documentada.
