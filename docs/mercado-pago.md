# Mercado Pago — Checkout Transparente (API Orders) + Webhooks multi-tópico

## Arquitetura

```
POST /api/webhooks/mercado-pago
  → verify signature (x-signature / ts / data.id)
  → normalize topic (catálogo oficial)
  → persist MpWebhookEvent (idempotente)
  → route → handler
  → GET recurso oficial (quando aplicável)
  → efeitos de negócio + notificações (não bloqueantes)
```

Checkout: Public Key no browser → `POST /api/checkout/mercado-pago/order` → `POST /v1/orders`.

## Variáveis (somente nomes)

- `MERCADO_PAGO_ACCESS_TOKEN`
- `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY`
- `MERCADO_PAGO_ENVIRONMENT` (`test` | `production`)
- `MERCADO_PAGO_WEBHOOK_SECRET`

## Matriz de eventos (painel Webhooks)

| Evento (painel) | Topic / type | Backend | Banco | Cliente | Parceiro | Admin | Testes | Status real |
|-----------------|--------------|---------|-------|---------|----------|-------|--------|-------------|
| Order (MP) | `order` | Handler + GET `/v1/orders` | Payment/Order + MpWebhookEvent | Status pedido | Status | Hub eventos | Sim | **ACTIVE** |
| Alertas de fraude | `stop_delivery_op_wh` | Bloqueia expedição + refund tentativa | MpFraudAlert | Aviso genérico | Alerta | `/admin/mercado-pago/fraudes` | Sim | **ACTIVE** |
| Card Updater | `automatic-payments` / `topic_card_id_wh` | Registro | MpSubscriptionEvent | — | — | Catálogo | Sim | **NOT_APPLICABLE** |
| Envios | (aliases) | Registro | MpShipment | Se houver | — | Nota | Sim | **NOT_APPLICABLE** |
| Pagamentos legacy | `payment` | GET `/v1/payments` bridge | Snapshot + Payment | — | — | Hub | Sim | **PARTIAL** |
| Vinculação apps | `mp-connect` | Sem tokens | MpApplicationLink | — | — | Hub | Sim | **PARTIAL** |
| Reclamações | `topic_claims_integration_wh` | GET `/v1/claims` | MpClaim | Central financeira | Central | `/reclamacoes` | Sim | **ACTIVE** |
| Contestações | `topic_chargebacks_wh` | GET `/v1/chargebacks` | MpDispute | Central | Central | `/contestacoes` | Sim | **ACTIVE** |
| Perfil pagamento | — | Estrutural | MpPayerProfileEvent | — | — | Catálogo | Sim | **NOT_APPLICABLE** |
| Planos/assinaturas | `subscription_*` | Estrutural | MpSubscriptionEvent | Nota | — | Nota | Sim | **NOT_APPLICABLE** |
| Delivery proximity | — | Estrutural | — | — | — | Nota | Sim | **NOT_APPLICABLE** |
| Pedidos comerciais | `topic_merchant_order_wh` | GET `/merchant_orders` | MpCommercialOrder | — | — | Hub | Sim | **PARTIAL** |
| Point | `point_integration_wh` | Estrutural | MpPointEvent | — | — | Nota | Sim | **NOT_APPLICABLE** |
| Wallet Connect | `wallet_connect` | Estrutural | MpWalletEvent | — | — | Catálogo | Sim | **NOT_APPLICABLE** |
| Self Service | — | Estrutural | MpSelfServiceEvent | — | — | Catálogo | Sim | **NOT_APPLICABLE** |

**ACTIVE** = validação + consulta API (quando há endpoint) + persistência + efeitos + UI + testes.  
**PARTIAL** = processado com limitações (compat / sem OAuth completo).  
**NOT_APPLICABLE** = produto não usado no EcoPet; evento persistido sem efeito financeiro inventado.

## Modelos Prisma (principais)

`MpWebhookEvent`, `MpWebhookAttempt`, `MpResourceSnapshot`, `MpFraudAlert`, `MpClaim`, `MpDispute`, `MpShipment`, `MpApplicationLink`, `MpSubscriptionEvent`, `MpPointEvent`, `MpWalletEvent`, `MpCommercialOrder`, `MpReconciliationIssue`, flags `Order.fraudHold` / `Order.fulfillmentBlocked`.

## Segurança

- Assinatura + timestamp skew + idempotência + payload sanitizado.
- Nunca marcar pago só pelo webhook.
- Fraude: resposta 200 rápida (MP não retenta este tópico).
- Sem Access Token / secret / cartão no banco ou logs.

## Admin

- `/admin/mercado-pago/eventos`
- `/admin/mercado-pago/fraudes`
- `/admin/mercado-pago/reclamacoes`
- `/admin/mercado-pago/contestacoes`
- `/admin/financeiro/pagamentos` — lista + estorno total/parcial
- `/admin/financeiro/estornos` — solicitações e histórico
- `/admin/financeiro/conciliacao`
- `/api/admin/financeiro/metodos` — sync/habilitar meios suportados pela conta
- Reprocessar evento · Conciliar

## Meios de pagamento

Sincronizados via `GET /v1/payment_methods` → `PaymentMethodConfiguration`.  
Checkout só exibe métodos `enabled && supportedByAccount`.  
Parcelas: `GET /v1/payment_methods/installments` (nunca hardcoded).

## Estornos

Ver `docs/refunds.md`. API oficial: `POST /v1/payments/{id}/refunds`.  
Modelo `PaymentRefund`. Estoque não volta automaticamente no estorno.

## Cliente / Parceiro

- `/cliente/financeiro`
- `/partner/financeiro`
- Solicitação de estorno: `POST /api/orders/{orderId}/refund`

## Jobs

- `PROCESS_MP_WEBHOOK_RETRY`
- `MP_RECONCILE`

## Webhook URL

`https://eccopet.com/api/webhooks/mercado-pago` (quando domínio ativo).  
Testes: configurar URL de teste no painel; pagamentos TEST podem não notificar automaticamente.

## Split / OAuth

Não implementado. Sem ativação de marketplace split.

## Testes

```bash
npm run test:mercado-pago -w @ecopet/web
```

## LGPD

Payloads sanitizados; sem PAN/CVV; retenção via tabelas Mp*; exclusão segue política de pedidos do usuário.
