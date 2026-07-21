# Pagamentos — aceitação

## Sandbox / automatizado

- Preferência, webhook HMAC, idempotência: `npm run test:mercado-pago -w @ecopet/web`
- E2E foundation cria pedido **sem** pagamento aprovado

## Produção controlada (somente com autorização expressa)

Ver `production-smoke.md`. Não automatizar cartão real. Valor mínimo. Conta de teste. Documentar correlationId + webhook + estoque.
