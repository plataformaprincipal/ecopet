# Google Tag Manager — Deduplicação Transacional

## Objetivo

Evitar `purchase` / `refund` (e outros críticos) duplicados após reload ou double-submit.

## Fluxo purchase

1. Backend confirma pagamento (Mercado Pago)
2. Frontend chama `POST /api/telemetry/transactional-claim`
3. Se `claimed=true` → envia ao analytics / Data Layer uma vez
4. Se `claimed=false` → **não** reenvia
5. Defesa em profundidade: `sessionStorage` no client (`claimTransactionalOnce`)

## Chave

`SHA-256(eventName|entityType|entityId).slice(0,32)`

- Sem PII
- Sem ID externo do Mercado Pago como chave pública
- Índice único em `deduplicationKey`

## Modelo

`AnalyticsTransactionalDedup` — migration `20260720010000_analytics_transactional_dedup`.

## Refund

Após estorno admin bem-sucedido (`executePaymentRefund`), claim best-effort com `entityType=payment_refund` e `entityId=PaymentRefund.id`.

## Não fazer

- Warehouse de todos os eventos
- Depender só de localStorage
- Measurement Protocol sem secrets/consentimento explícitos
