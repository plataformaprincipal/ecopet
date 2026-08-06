# Revisão do Working Tree — Fase 2.1

**Branch:** `feat/fase-2-fluxo-comercial-minimo`  
**Base commit:** `b1405fc`  
**Data:** 2026-08-06  
**Regra:** nenhum secret no Git; sem descarte automático de arquivos não reconhecidos.

## Classificação

| Arquivo | Origem | Deve entrar no commit | Justificativa | Risco |
| ------- | ------ | --------------------: | ------------- | ----- |
| `.env.example` | FASE 1 | Sim | Comentário `ALLOW_SIMULATED_PAYMENTS` (sem secret) | Baixo |
| `scripts/test.mjs` | FASE 1 + FASE 2 | Sim | Inclui simulated-payments, partner-access-gate, commerce-unit | Baixo |
| `scripts/test-ngo-experience.mjs` | FASE 1 | Sim | Alinha rotas PT / expectativas | Baixo |
| `scripts/test-partner-experience.mjs` | FASE 1 | Sim | Gate APPROVED | Baixo |
| `scripts/test-permissions.mjs` | FASE 1 | Sim | Redirect CLIENT → `/client` | Baixo |
| `AUDITORIA_TECNICA_ECCOPET.md` | DOCUMENTAÇÃO | Sim (opcional) | Auditoria pré-Fase 1; útil no histórico | Baixo |
| `packages/database/prisma/schema.prisma` | FASE 2 | Sim | Campos snapshot/pricing/idempotency | Médio (schema) |
| `packages/database/prisma/migrations/20260806120000_fase2_commercial_pricing_snapshot/migration.sql` | FASE 2 | Sim | Migration nova; rastreável (não ignorada) | Médio |
| `apps/web/src/lib/orders/checkout-service.ts` | FASE 2 | Sim | Checkout oficial | Médio |
| `apps/web/src/app/api/checkout/route.ts` | FASE 2 | Sim | Idempotency + erros | Médio |
| `apps/web/src/lib/cart/cart-service.ts` | FASE 2 | Sim | Gate parceiro aprovado no carrinho | Médio |
| `apps/web/src/lib/commerce/*` | FASE 2 | Sim | Pricing + state machine + testes | Médio |
| `apps/web/src/lib/payments/provider.ts` | FASE 2 | Sim | Contrato MP oficial | Baixo |
| `apps/web/src/lib/payments/simulated-payments.ts` | FASE 1/2 | Sim | PAID só webhook/poll | Alto se regressão |
| `apps/web/src/lib/payments/simulated-payments.test.ts` | TESTE | Sim | Cobertura fontes PAID | Baixo |
| `apps/web/src/lib/mercado-pago/apply-payment-status.ts` | FASE 2 | Sim | Valor divergente / ID conflito / cancelado | Alto |
| `apps/web/src/lib/mercado-pago/create-checkout-order.ts` | FASE 2 | Sim | Create não marca PAID | Alto |
| `apps/web/src/lib/mercado-pago/webhooks/handlers/order.ts` | FASE 2 | Sim | `receivedAmount` + eventId | Alto |
| `apps/web/src/lib/orders/api.ts` | FASE 2 | Sim | Cliente Next (sem Express) | Médio |
| `apps/web/src/lib/marketplace/partner-api.ts` | FASE 2 | Sim | Cliente Next partner | Médio |
| `apps/web/src/app/api/client/orders/[orderId]/route.ts` | FASE 2 | Sim | GET + pickup | Médio |
| `apps/web/src/app/api/partner/orders/[orderId]/status/route.ts` | FASE 2 | Sim | State machine + bloqueio financeiro | Alto |
| `apps/web/src/components/features/marketplace/product-detail-content.tsx` | FASE 2 | Sim | Carrinho servidor | Baixo |
| `apps/web/src/components/features/marketplace/service-detail-content.tsx` | FASE 2 | Sim | Remove carrinho Zustand de serviço | Baixo |
| `apps/api/src/middleware/commercial-legacy-disabled.ts` | FASE 2 | Sim | 410 mutações comerciais | Médio |
| `apps/api/src/index.ts` | FASE 2 | Sim | Wire do middleware 410 | Médio |
| `docs/FASE_2_*.md` / `ORDER_STATE_MACHINE.md` / `PRICING_*` | DOCUMENTAÇÃO | Sim | Entregáveis Fase 2 | Baixo |
| `scripts/test-fase2-commercial-flow.mjs` | TESTE | Sim | E2E HTTP homologação Fase 2.1 | Baixo |
| `docs/WORKING_TREE_REVIEW.md` | DOCUMENTAÇÃO | Sim | Classificação do tree | Baixo |
| `docs/FASE_2_1_HOMOLOGACAO_SANDBOX_RESULTADO.md` | DOCUMENTAÇÃO | Sim | Relatório Fase 2.1 | Baixo |
| `apps/web/src/lib/mercado-pago/webhooks/pipeline.ts` | FASE 2 / 2.1 | Sim | Fail-closed sem webhook secret | Alto |
| `apps/web/src/lib/mercado-pago/webhook-signature.ts` | FASE 2.1 | Sim | Secret env + `secret:""` explícito | Médio |
| `apps/web/tsconfig.tsbuildinfo` | TEMPORÁRIO | **Não** | Artefato de build TS; regenerável | Baixo (ruído) |
| `.env` / `.env.local` / `.env.production` | SEGREDO | **Não** | Ignorados pelo `.gitignore` | Crítico se commitados |
| `node_modules` / `.next` / `coverage` / `test-results` / `playwright-report` | TEMPORÁRIO | **Não** | Artefatos locais | — |
| `*.dump` / dumps SQL fora de migrations | SEGREDO / TEMPORÁRIO | **Não** | Não presentes no tree atual | — |

## Verificações de segurança

| Item | Resultado |
| ---- | --------- |
| `.env` no Git | Ignorado (`.gitignore`) |
| Secrets no diff | Nenhum valor secreto em `.env.example` (apenas comentário) |
| Migration SQL | Untracked, **não** ignorada (exceção `!packages/database/prisma/migrations/**/*.sql`) |
| Migrations históricas editadas | Não |

## Recomendação de commit (quando autorizado)

Incluir tudo classificado como Sim, **exceto** `apps/web/tsconfig.tsbuildinfo`.  
Restaurar `tsbuildinfo` com `git checkout -- apps/web/tsconfig.tsbuildinfo` antes do stage, se desejado.
