# Fase 2 — Fluxo Comercial Mínimo — Resultado

**Branch:** `feat/fase-2-fluxo-comercial-minimo`  
**Base:** `b1405fc` (Fase 1)  
**Data:** 2026-08-06  
**Commit:** não criado (alterações no working tree para revisão)

---

## 1. Resumo executivo

Consolidou-se o funil comercial mínimo no Next.js: parceiro aprovado → produto → carrinho servidor → checkout transacional com snapshot/precificação → pagamento Mercado Pago sandbox → PAID apenas via webhook/poll → fulfillment parceiro → acompanhamento cliente → cancel/refund mínimo. Mutações comerciais no Express foram desativadas (410).

## 2. Pré-requisitos da Fase 1

Mantidos:

- 27 migrations + nova migration Fase 2 (28 total)
- `sim_*` bloqueado em produção
- parceiro `PENDING` no registro; acesso operacional `ACTIVE + APPROVED + approvedAt`
- mapa Express e testes de gate

Working tree **não** estava limpo no início (resíduos Fase 1: `scripts/test*.mjs`, `.env.example`, `AUDITORIA_TECNICA_ECCOPET.md`). Esses itens permaneceram no tree; mudanças comerciais da Fase 2 foram adicionadas sem misturar intenção silenciosa — scripts de teste Fase 1 foram aproveitados/estendidos.

## 3. Arquitetura comercial escolhida

Ver `docs/FASE_2_ARQUITETURA_COMERCIAL.md`.

```text
Browser → Next Route Handler → Service → Prisma → Supabase
```

Provedor oficial: **Mercado Pago** (sandbox). Stripe fora do fluxo mínimo.  
Regra: **um pedido por parceiro**.

## 4. Rotas Next.js oficiais

| Fluxo | Rota |
| ----- | ---- |
| Carrinho | `/api/cart`, `/api/cart/items` |
| Checkout | `/api/checkout` |
| Pagamento MP | `/api/checkout/mercado-pago/*` |
| Webhook | `/api/webhooks/mercado-pago` |
| Pedidos cliente | `/api/client/orders`, `.../cancel` |
| Pedidos parceiro | `/api/partner/orders`, `.../status` |
| Produtos/serviços parceiro | `/api/partner/products`, `/api/partner/services` |
| Reembolso | `/api/orders/[orderId]/refund` |
| Admin | `/api/admin/orders`, `/api/admin/mercado-pago/*` |

## 5. Dependências Express restantes

Mutações em `/api/orders`, `/api/cart`, `/api/marketplace/partner`, `/api/products`, `/api/services` → **410** (`blockCommercialMutations`).  
GET legado permanece temporariamente com header `Deprecation`.  
Domínios não comerciais (pets, IoT, robots, wallet, gestor bootstrap) seguem no mapa Fase 1.

## 6. Produtos

- CRUD Next com `requireApprovedPartner` no POST
- Validação Zod (preço > 0, estoque inteiro ≥ 0, categoria, etc.)
- Carrinho exige produto ACTIVE + APPROVED + parceiro ACTIVE/APPROVED/`approvedAt`
- Detalhe de produto adiciona via `/api/cart` (não Zustand)

## 7. Serviços

- CRUD/publicação Next com gate de parceiro aprovado
- Agendamento via carrinho Zustand **removido** do detalhe (evita preço client-side)
- Checkout de serviço no carrinho produto **não** faz parte do funil mínimo desta fase (documentado)

## 8. Carrinho

- Persistência Prisma (user/session)
- Preço sempre do servidor (`serializeCart` / checkout)
- Rejeita multi-parceiro, estoque insuficiente, produto/parceiro inválido

## 9. Checkout

- Transação Prisma: valida → precifica → `updateMany` estoque → Order + OrderItem snapshot → Payment PENDING → limpa carrinho
- Estado inicial: `PENDING_CONFIRMATION` + Payment `PENDING`
- Idempotência via header `Idempotency-Key` / `idempotencyKey`
- Não cria `PAID` no checkout

## 10. Pedidos

- Cliente: listagem/detalhe próprios; IDOR → 404
- Parceiro: apenas `partnerId` próprio; status operacional via state machine
- Parceiro **não** pode setar `PAID`/`REFUNDED`

## 11. Pagamento sandbox

- Contrato: `apps/web/src/lib/payments/provider.ts` (`create/get/cancel/refund/verifyWebhook`)
- Create MP **não** marca APPROVED/PAID (persiste PROCESSING e aguarda webhook/poll)
- Secrets só no servidor

## 12. Webhook

- HMAC + pipeline existente
- Comparação de valor (`receivedAmount` vs `Payment.amount`)
- Conflito de ID externo entre pedidos bloqueado
- PAID rejeitado se pagamento/pedido cancelado
- Idempotência e eventos persistidos (pipeline MP)

## 13. Máquina de estados

Ver `docs/ORDER_STATE_MACHINE.md` + `order-state-machine.ts`.

## 14. Estoque

| Momento | Ação |
| ------- | ---- |
| Checkout | Reduz com `stock >= qty` (condicional) |
| Cancelamento pré-pago / falha pagamento | Repõe |
| Reembolso | Não repõe automaticamente (exige fluxo físico/admin) |

## 15. Cancelamento e reembolso

- Cliente cancela `PENDING_CONFIRMATION` (estoque reposto; cancela cobrança pendente MP)
- Reembolso: solicitação via `/api/orders/[id]/refund` (fluxo MP existente; REFUNDED só após confirmação adequada)
- Política ainda depende de validação jurídica/comercial

## 16. Notificações

Persistidas no checkout e no pagamento aprovado (`ORDER_CREATED`, `ORDER_RECEIVED`, `PAYMENT_APPROVED`, `ORDER_PAID`, status updates). E-mail não bloqueia a transação.

## 17. Administração e auditoria

- `writeAuditLog` em checkout, status parceiro, pagamento, pickup
- Admin continua com rotas `/api/admin/*` e painéis MP
- Sem secrets/cartão em logs

## 18. Precificação implementada

Ver `docs/PRICING_IMPLEMENTATION_STATUS.md`.  
`partnerAmount` = valor contábil esperado, **não** repasse.

## 19. Testes executados

| Comando | Resultado |
| ------- | --------- |
| `npm run db:generate` | OK |
| `npx prisma validate` | OK |
| `npx prisma migrate deploy` | OK (aplicou `20260806120000_fase2_commercial_pricing_snapshot`) |
| `npx prisma migrate status` | up to date (28) |
| `npm run lint` | OK |
| `npm run type-check` | OK (web com `NODE_OPTIONS=--max-old-space-size=8192`) |
| `npm run build` | OK |
| `npm run test` | OK (inclui commerce-unit, simulated-payments, partner-access-gate) |
| `npm run test:mercado-pago` | OK (20) |
| `scripts/test-fase2-commercial-flow.mjs` | **Não executado E2E** — requer `WEB_URL`/servidor Next ativo |
| `npm run test:e2e` / `test:integration` | Não inventados como sucesso; Playwright não rodado nesta sessão |

## 20. Erros restantes

- Roteiro E2E comercial HTTP não validado com servidor vivo nesta sessão
- Checkout de serviços ainda fora do carrinho servidor
- `checkout-steps.tsx` legado ainda no repo (usa API desabilitada; documentado como legado)
- Type-check web exige heap elevado (OOM sem `--max-old-space-size=8192`)
- GET Express comerciais ainda respondem (somente leitura depreciada)

## 21. Riscos para piloto

- Homologação depende de credenciais MP sandbox + webhook público (Vercel)
- Sem split: parceiro não recebe repasse automático
- Concorrência de estoque coberta por update condicional; teste HTTP concorrente não rodado
- Política de reembolso conservadora / parcial

## 22. Arquivos alterados (principais)

- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/migrations/20260806120000_fase2_commercial_pricing_snapshot/`
- `apps/web/src/lib/orders/checkout-service.ts`, `api/checkout/route.ts`
- `apps/web/src/lib/cart/cart-service.ts`
- `apps/web/src/lib/commerce/*`
- `apps/web/src/lib/payments/*`
- `apps/web/src/lib/mercado-pago/apply-payment-status.ts`, `create-checkout-order.ts`, webhooks/order
- `apps/web/src/lib/orders/api.ts`, `marketplace/partner-api.ts`
- `apps/api/src/middleware/commercial-legacy-disabled.ts`, `index.ts`
- Produto/serviço detail UI
- Docs Fase 2 + scripts de teste

## 23. Migrations criadas

| Migration | Objetivo |
| --------- | -------- |
| `20260806120000_fase2_commercial_pricing_snapshot` | Snapshot/pricing/idempotency em Order/OrderItem + PlatformSettings |

Históricas **não** alteradas. **Sem** `migrate reset`.

## 24. Variáveis de ambiente necessárias

| Variável | Uso |
| -------- | --- |
| `DATABASE_URL` / `DIRECT_URL` | Prisma |
| `MERCADO_PAGO_ACCESS_TOKEN` | Sandbox (TEST-*) |
| `MERCADO_PAGO_WEBHOOK_SECRET` | HMAC webhook |
| `MERCADO_PAGO_PUBLIC_KEY` | Frontend quando necessário |
| `MERCADO_PAGO_ENVIRONMENT=test` | Sandbox |
| `ALLOW_SIMULATED_PAYMENTS` | Apenas não-produção |
| `API_INTERNAL_URL` | Opcional; não necessário ao funil comercial Next |

## 25. Procedimento de homologação na Vercel

1. Aplicar migration `20260806120000_fase2_commercial_pricing_snapshot` no banco de homologação (`migrate deploy`)
2. Configurar secrets MP **test** + webhook apontando para `/api/webhooks/mercado-pago`
3. Garantir `ALLOW_SIMULATED_PAYMENTS` ausente/false em production
4. Fluxo: aprovar parceiro → criar produto → carrinho → checkout → PIX/card sandbox → webhook → PAID
5. Validar painel parceiro/cliente/admin e ausência de mutação via Express (410)
6. Rodar `node scripts/test-fase2-commercial-flow.mjs` com `WEB_URL` da homologação

## 26. Veredito

```text
FASE 2 PARCIALMENTE CONCLUÍDA
```

```text
PRONTO PARA TESTE SANDBOX
```

Justificativa: funil produto/checkout/pagamento/webhook consolidado no Next com testes unitários e build verdes; E2E HTTP completo e checkout de serviços ainda pendentes de homologação com servidor + MP sandbox vivos. **Não** pronto para produção comercial.
