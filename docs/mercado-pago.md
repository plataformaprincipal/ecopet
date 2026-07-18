# Mercado Pago — Checkout Transparente (API Orders)

## Arquitetura

```
Cliente (Public Key / SDK JS)
  → tokeniza cartão no browser
  → POST /api/checkout/mercado-pago/order
       → servidor recalcula pedido EcoPet
       → persiste Payment + idempotencyKey
       → POST https://api.mercadopago.com/v1/orders (Access Token)
       → atualiza status interno

Webhook (quando cadastrado)
  → POST /api/webhooks/mercado-pago
       → valida x-signature + timestamp
       → GET /v1/orders/{id} (fonte da verdade)
       → aplica Payment/Order + estoque + notificações
```

- **Não** usa Checkout Pro / Preferences.
- **Não** usa a API de Pagamentos legada (`/v1/payments`) como caminho canônico.
- Pedido só fica `PAID` após resposta server-side confirmada ou webhook validado + consulta à API.

## Variáveis (apenas nomes)

| Variável | Onde |
|----------|------|
| `MERCADO_PAGO_ACCESS_TOKEN` | servidor |
| `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY` | browser |
| `MERCADO_PAGO_ENVIRONMENT` | `test` (padrão seguro) \| `production` |
| `MERCADO_PAGO_WEBHOOK_SECRET` | servidor (assinatura) |
| `PAYMENT_PROVIDER` | opcional (`none` / preferência) |

Nunca versione valores reais. Nunca exponha o Access Token no frontend.

## Ambiente de teste

1. Crie aplicação no painel Mercado Pago com **Checkout Transparente** + **API Orders**.
2. Use **credenciais de teste**.
3. Defina `MERCADO_PAGO_ENVIRONMENT=test`.
4. Tokens `TEST-*` forçam modo test mesmo se environment=production.

## Instalação / execução local

```bash
npm install
npm run db:generate
# aplicar schema (migrate deploy ou db:push conforme o ambiente)
npm run sync:env
npm run dev
```

Checkout: `/checkout` → opção **Pagar agora (Mercado Pago)** quando Public Key + Access Token estiverem configurados.

## Rotas

| Método | Path | Auth |
|--------|------|------|
| GET | `/api/checkout/mercado-pago/config` | cliente |
| POST | `/api/checkout/mercado-pago/order` | cliente |
| GET | `/api/checkout/mercado-pago/order/[id]` | cliente |
| POST | `/api/webhooks/mercado-pago` | público + assinatura |
| GET | `/api/admin/integrations/mercado-pago/diagnostics` | ADMIN |

## Testes

```bash
npm run test:mercado-pago -w @ecopet/web
```

Cobertura: config, modo test, ausência de Access Token no bundle/log patterns, assinatura webhook, mapeamento de status, erros HTTP mapeados.

## Cartões / contas de teste

Use exclusivamente os cartões e usuários de teste oficiais do Mercado Pago (documentação do painel).  
**Não** documente números/credenciais neste repositório.

## Webhook (pendente até domínio)

URL futura: `https://eccopet.com/api/webhooks/mercado-pago`

Enquanto o domínio/secret não estiverem cadastrados:

- build **não** falha;
- status admin: `TEST_READY` ou `WEBHOOK_PENDING`;
- pagamentos de teste podem ser confirmados via resposta da API + polling `GET order`.

## Produção (pendências)

1. Credenciais de produção (não misturar com TEST).
2. `MERCADO_PAGO_ENVIRONMENT=production` apenas com token prod.
3. Cadastrar webhook + secret.
4. Validar 3DS / meios de pagamento reais.
5. Conciliação e política de estornos.
6. **Split / marketplace OAuth** — **não implementado**. Apenas metadados estimados por parceiro no Payment.

## Rotação de credenciais

1. Gere novo Access Token / Public Key no painel.
2. Atualize Vercel + `.env` local.
3. Revogue o token antigo.
4. Rode diagnóstico ADMIN (`probe=1`) — sem cobrança.

## Diagnóstico admin

`/admin/integracoes` → card Mercado Pago → **Probe API (sem cobrança)**.

Estados: `NOT_CONFIGURED` | `TEST_READY` | `WEBHOOK_PENDING` | `ACTIVE` | `DEGRADED` | `AUTH_ERROR` | `WEBHOOK_ERROR` | `ERROR`.

## Limitações atuais

- Split de pagamento / repasse automático: **não pronto**.
- Cancelamento/estorno automático via API: parcialmente documentado; conciliação manual.
- Webhooks de teste do MP podem ser limitados — preferir consulta server-side após criar a order.
- Estoque: baixa no `checkoutFromCart`; liberação idempotente se pagamento falhar/estornar.

## Confirmações de segurança

- Access Token nunca no browser.
- Sem dados de cartão no banco EcoPet.
- Sem mocks de pagamento em produção.
- Sem cobrança real com `MERCADO_PAGO_ENVIRONMENT=test` + credenciais TEST.
