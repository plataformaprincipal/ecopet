# Fase 3 — Estado financeiro atual (inventário pré-implementação)

**Branch:** `feat/fase-3-financial-ledger`  
**Base:** `0646e06` (`chore/fase-2-2-preview-homologacao` consolidada)  
**Data:** 2026-08-06  
**Escopo:** inventário somente — nenhum código alterado antes deste documento.

---

## 1. Pré-requisitos (validação inicial)

| Item | Status | Nota |
| ---- | ------ | ---- |
| Working tree limpo | Parcial | Branch criada limpa; `tsconfig.tsbuildinfo` pode sujar localmente |
| Fase 2.2 concluída | **Não** | `FASE 2.2 BLOQUEADA` — Preview sem URL utilizável |
| Preview funcional | **Não** | Deploy falhou (Root Directory / Output Directory) |
| Mercado Pago sandbox validado | Parcial | Fase 2.1 local OK; webhook externo Preview **não** |
| Webhook externo validado | **Não** | Dependente de Preview |
| Idempotência validada | Parcial | Local (2.1); serverless Preview **não** |
| Migration Fase 2 rastreada | Sim | `20260806120000_fase2_commercial_pricing_snapshot` em `0646e06` |
| Banco de homologação separado | **Não comprovado** | `DATABASE_URL` Preview/Production podem coincidir |
| Nenhuma credencial de produção | Intenção | Sandbox local; pull MP TEST não revalidado nesta fase |
| `npm run lint` | OK | |
| `npm run type-check` | OK | |
| `npx prisma validate` | OK | |
| `npx prisma migrate status` | OK (28 migrations, up to date no DB apontado) | |
| `npm run db:generate` | Falhou EPERM (DLL Prisma em uso) — reexecutar sem servidor | |

**Itens críticos pendentes registrados:** Fase 2.2 / Preview / webhook externo / isolamento de banco. A Fase 3 avança em estrutura financeira local + sandbox, sem claim silencioso de homologação Preview.

---

## 2. Inventário por conceito

| Conceito | Onde é calculado | Onde é persistido | Fonte | Problema | Ação |
| -------- | ---------------- | ----------------- | ----- | -------- | ---- |
| GMV / gross | `pricing-pure.calculateOrderPricing` | `Order.grossAmount`, `Order.total`, `Payment.amount` | Preços servidor no checkout | Frete/desconto existem no schema mas ficam 0 no path comercial | Snapshot imutável; relatório GMV ≠ receita |
| `platformFeePercent` | `loadPricingSettings` + defaults | `PlatformSettings.platformFeePercent` (default 10) | Settings / fallback hardcode 10 | Admin UI às vezes recalcula 10% sobre `Order.total` | Usar snapshot do pedido |
| `platformFixedFee` | Soma no nível do pedido | Embutido em `Order.platformFeeAmount` | Settings (default 0) | Não há campo dedicado no Order; linhas ≠ total quando fixed > 0 | Separar % vs fixa no allocation/ledger |
| `platformFeeAmount` | `pricing-pure` | `Order` / `OrderItem` | Snapshot checkout | Contábil; não gera crédito de plataforma | Ledger `PLATFORM_COMMISSION` + `PLATFORM_FIXED_FEE` |
| `partnerAmount` | `gross − platformFee` | `Order` / `OrderItem` | Snapshot | **Não** é payout; ERP/partner UI usam gross ou 92% | Ledger `PARTNER_PAYABLE`; saldos derivados |
| `pricingVersion` | Settings no checkout | Order/Item | `PlatformSettings` | UIs/admin ignoram e recalculam | Imutável; allocation só do snapshot |
| Taxa gateway estimada | Quase ausente | `Payment.metadata` parcial (`platformFeeEstimated` null no MP path) | Hardcode / null | Estimativa confundida com real; metadata MP sobrescreve snapshot | `gatewayFeeEstimated` / `gatewayFeeActual` + ajuste |
| Taxa gateway real | Não | Não | — | Sem atualização pós-liquidação | Ajuste compensatório no ledger |
| Comissão / take-rate UI | `dashboard-service` 0.1; ERP 0.08 | Não (recalculado) | Hardcode | Duplicado e diverge do snapshot | Remover hardcode das leituras financeiras |
| Reserva | Não | Não | — | Sem proteção cancelamento/chargeback | `RESERVE_HOLD` / release / consume |
| Settlement / payout | ERP inventa `received × 0.92` | Sem modelo `Payout` | Hardcode | Parceiro “pago” sem ledger | Modelo Payout sandbox + estados |
| Ledger | Não | Não | — | Valores dispersos; saldo não auditável | `FinancialLedgerEntry` + contas |
| Wallet comprador | API `wallet-service` | `Wallet` / `WalletTransaction` | Crédito/débito comprador | Confunde com saldo parceiro | Manter separado; não usar como payout |
| Refund MP | `refunds.ts` | `PaymentRefund`, `Payment.refundedAmount` | Gateway | Não reverte comissão/parceiro no ledger | Reversões ledger + política explícita |
| Refund legado | API `Refund` + wallet | `Refund` | Path Express | Dois modelos | Não misturar; ledger só no path comercial web |
| Chargeback / disputa | `MpDispute` | `MpDispute` (`payoutBlocked`) | Webhook MP | Sem débito ledger / saldo negativo | `Chargeback` financeiro + bloqueio |
| Impostos | Dashboard ~15% | Não | Heurística | Apresentado como se fosse real | `taxEstimated` operacional + doc limitações |
| Conciliação | Páginas admin financeiro | Pagamentos/estornos listados | Ops UI | Sem match pedido↔gateway↔ledger | `reconcilePayment` + daily run |
| Split lógico | Implícito em `partnerAmount` | Campos Order | Snapshot | Sem contas/saldos | `calculateCommercialAllocation` |
| Multiparceiro | Checkout 1 `partnerId` | Order.partnerId | Regra Fase 2 | OK temporário | Documentar “um checkout por parceiro” |
| Float money | `roundMoney` 2dp | `Float` em Order/Payment | JS number | Risco de imprecisão | Ledger em **centavos (Int)**; conversão nas bordas |

---

## 3. Problemas estruturais identificados

1. **Cálculos duplicados:** snapshot no checkout + 10% admin + 8% ERP + metadata MP nula.
2. **Hardcodes:** 10%, 8%/92%, 15% imposto, 2% cashback (API legado).
3. **Campos sem uso financeiro real:** `partnerAmount` gravado mas nunca liquida; `splitReady` false.
4. **Frontend/ERP como fonte:** KPIs de payout sem persistência.
5. **Sem versionamento de custos gateway/imposto** no pedido.
6. **Comissão exibida sem ledger.**
7. **Parceiro calculado sem obrigação formal (payable).**
8. **Taxa estimada = taxa real** por omissão.
9. **GMV tratado como receita** em painéis que somam `Payment.amount` APPROVED.
10. **PAID sem conciliação / sem lançamentos.**

---

## 4. Fluxo atual (pós Fase 2)

```text
PlatformSettings → pricing-pure → Order/Item snapshot
  → Payment PENDING
  → webhook/poll → Order PAID
  → (nada no ledger / nada no saldo parceiro)
  → refund MP → PaymentRefund (sem reversão contábil de split)
```

---

## 5. Superfícies existentes a reutilizar

| Superfície | Path | Uso na Fase 3 |
| ---------- | ---- | ------------- |
| Admin financeiro | `/admin/financeiro/*`, `/api/admin/financeiro/*` | Estender leituras (ledger, payouts, recon) |
| Partner financeiro | `/partner/financeiro`, `/api/partner/financeiro` | Saldos derivados + histórico |
| FeatureFlag model | `FeatureFlag` | Flags financeiras (e/ou env) |
| MpDispute | schema | Base para chargeback / bloqueio |
| AuditLog | `writeAuditLog` | Ações admin financeiras |
| PaymentRefund | schema | Integrar reversões |

---

## 6. Decisão de política provisória (explícita — não inventada silenciosamente)

Enquanto não houver documento comercial aprovado:

| Tema | Política provisória Fase 3 |
| ---- | -------------------------- |
| Quem absorve taxa gateway | **Parceiro** (deduzida do payable no allocation) — configurável |
| Reserva | % configurável do `partnerPayable` (default conservador 2%), bloqueada até elegibilidade |
| Imposto estimado | Sobre **receita plataforma** (comissão + fixa), não sobre GMV; status `ESTIMATED` |
| Reembolso integral | Reverte payable/comissão/reserva conforme config; fee gateway não devolvida → custo plataforma ou parceiro via flag |
| Multiparceiro | **Um checkout por parceiro** (já vigente) |
| Repasse | Sandbox/admin apenas; `MANUAL_PAYOUT_APPROVAL_REQUIRED=true` |

Todas marcadas como **provisórias** nos docs de modelo/resultado.

---

## 7. Próximo passo

Implementar modelo de ledger, contas, allocation central, postagem no PAID, saldos, reserva, payout sandbox, reembolso/chargeback, conciliação, flags, testes e E2E — sem Production e sem merge em `main`.
