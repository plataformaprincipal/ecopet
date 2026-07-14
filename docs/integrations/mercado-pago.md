# Mercado Pago

## Variáveis
```
PAYMENT_PROVIDER=none
MERCADO_PAGO_ACCESS_TOKEN=
MERCADO_PAGO_PUBLIC_KEY=
MERCADO_PAGO_WEBHOOK_SECRET=
```

## Sem chave / `PAYMENT_PROVIDER=none|manual`
- Pedidos ficam pendentes
- **Não** marcar pago
- UI não deve prometer PIX/cartão ativo

## Ativação
1. `PAYMENT_PROVIDER=mercado_pago` + tokens
2. Configurar webhook
3. Smoke admin payment test
