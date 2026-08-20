# OAuth do vendedor Mercado Pago — sandbox

O fluxo de código existe (`/api/partner/financeiro/mp-connection` + callback).

**Não marcar PASS por mock.**

## Estado atual

- `MERCADO_PAGO_CLIENT_ID` / `MERCADO_PAGO_CLIENT_SECRET` ausentes no ambiente de testes desta execução.
- Status ERP: `NOT_CONNECTED` (honesto).
- Tokens, se existirem, ficam cifrados (`accessTokenEnc` / `refreshTokenEnc`) e **nunca** retornam à UI.

## Ação externa necessária (não automatizável aqui)

1. Criar/usar aplicação Mercado Pago marketplace (sandbox).
2. Configurar redirect URI: `{APP_URL}/api/partner/financeiro/mp-connection/callback`.
3. Injetar `MERCADO_PAGO_CLIENT_ID` e `MERCADO_PAGO_CLIENT_SECRET` **somente no servidor**.
4. Parceiro clica “Autorizar Mercado Pago” e completa o consentimento no domínio Mercado Pago.
5. Callback troca `code` por tokens e persiste cifrado.

OAuth E2E automático **não** foi marcado PASS nesta missão.
