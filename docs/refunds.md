# Estornos EcoPet (Mercado Pago)

## Tipos

| Tipo | Descrição |
|------|-----------|
| FULL | Estorna todo o saldo reembolsável |
| PARTIAL | Estorna valor &lt; saldo; permite múltiplos até zerar |

## Fluxos

### Admin (execução)

1. `/admin/financeiro/pagamentos` → Estornar  
2. Motivo obrigatório + confirmação  
3. Lock lógico no `Payment`  
4. Consulta `GET /v1/payments/{id}`  
5. `POST /v1/payments/{id}/refunds` (vazio = total; `{ amount }` = parcial)  
6. Atualiza `Payment.refundedAmount`, `PaymentRefund`, `Order` (`PARTIALLY_REFUNDED` / `REFUNDED`)  
7. Notifica cliente e parceiro  
8. **Não** devolve estoque automaticamente (`stockReturnStatus`)

### Cliente (solicitação)

`POST /api/orders/{orderId}/refund` → cria `PaymentRefund` `REQUESTED`  
Admin aprova/rejeita em `/admin/financeiro/estornos`.

## Cancelamento vs estorno

| Situação | Ação |
|----------|------|
| Pagamento pendente | Cancelamento (`PUT` status cancelled) |
| Pagamento aprovado | Estorno |

## Estoque

- Reserva no checkout.  
- Libera em rejeição/cancelamento/expiração.  
- Estorno: devolução física/admin (`NOT_REQUIRED` / `PENDING_RETURN` / `RESTOCKED`).

## Idempotência

Cada estorno usa `idempotencyKey` único; lock impede dois admins de ultrapassar o saldo.

## Prazos

Texto ao cliente: prazo de disponibilização depende do meio e da instituição financeira.
