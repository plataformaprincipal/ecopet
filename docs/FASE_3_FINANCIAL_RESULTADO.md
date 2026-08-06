# Fase 3 — Estrutura financeira — Resultado

**Branch:** `feat/fase-3-financial-ledger`  
**Data:** 2026-08-06  
**Base:** `0646e06`

---

## 1. Resumo executivo

Implementada a estrutura financeira mínima auditável: ledger em centavos, split lógico a partir do snapshot do pedido, contas separadas, reserva, saldos derivados, repasse sandbox com aprovação admin, reembolso/chargeback no ledger, conciliação e flags. **Não** há transferência bancária real nem deploy Production. Preview da Fase 2.2 permanece bloqueado — E2E Preview desta fase **não** executado.

## 2. Pré-requisitos

| Item | Status |
| ---- | ------ |
| Working tree / branch | `feat/fase-3-financial-ledger` |
| Fase 2.2 | **BLOQUEADA** (sem Preview utilizável) |
| MP sandbox local | Validado na 2.1 |
| Webhook externo Preview | **Não** |
| Migration Fase 2 | Rastreada |
| Migration Fase 3 | `20260806180000_fase3_financial_ledger` aplicada no DB apontado |
| Credenciais produção | Não utilizadas para cobrança/repasse real |

## 3. Estado financeiro anterior

Ver `docs/FASE_3_FINANCIAL_CURRENT_STATE.md`.

## 4. Modelo de ledger

- `LedgerAccount` + `FinancialLedgerEntry` (append-only, `idempotencyKey` único)
- Postagem em `applyInternalPaymentStatus` na mesma transação do PAID (com recovery)
- Correções = novos lançamentos

## 5. Contas financeiras

Ver `docs/FINANCIAL_ACCOUNTING_MODEL.md`.  
Nota: `FinancialAccount` do Gestor permanece separado; ledger usa `LedgerAccount`.

## 6. Split lógico

`calculateCommercialAllocation` em `apps/web/src/lib/finance/allocation.ts`.  
Snapshot no checkout: `%`, fixa, gateway estimado, reserva, tax estimate, `partnerAmount`.

## 7. Precificação

Imutável no pedido (`pricingVersion` + campos snapshot). Ledger **não** recalcula com tabela vigente.

## 8. Reserva

`RESERVE_HOLD` + `FinancialReserve`; liberação via `releaseEligiblePartnerBalances` (admin).  
Política provisória: % configurável + `reserveHoldDays`.

## 9. Saldo do parceiro

Derivado do ledger (`getPartnerBalances`). API `GET /api/partner/financeiro/balances` (anti-IDOR).

## 10. Repasses

`PartnerPayout` sandbox: PENDING → APPROVED (admin) → PAID (admin auditado). Sem banco real.  
Autoaprovação do solicitante bloqueada.

## 11. Reembolsos

`postLedgerForRefund` após estorno MP; reversões de comissão/parceiro/reserva (política provisória).

## 12. Chargebacks

`FinancialChargeback` + débitos ledger + bloqueio de payable + notificação admin.

## 13. Saldo negativo

Visível em `negativeCents`; repasse bloqueado se negativo.

## 14. Conciliação

`reconcilePayment` + `runDailyFinancialReconciliation` (manual admin; daily flag default off).

## 15. Taxas do gateway

`gatewayFeeEstimated` / `gatewayFeeActual` + `applyGatewayFeeActual` (ajuste compensatório).

## 16. Impostos estimados

Sobre receita plataforma; ver `docs/TAX_ESTIMATION_LIMITATIONS.md`.

## 17. Multiparceiro

Checkout continua **um parceiro por pedido** (`MULTI_PARTNER_CART`). Sem `partnerAmount` agregado multi-seller.

## 18. Autorizações

Cliente sem ledger; parceiro só próprio saldo; admin aprova payout/ajuste/conciliação. Audit log nas ações.

## 19. Painel administrativo

`/admin/financeiro/ledger` + links CSV; APIs em `/api/admin/financeiro/*`.

## 20. Painel do parceiro

Saldos e disclaimer em `/partner/financeiro`.

## 21. Relatórios

`buildFinancialReport` + `docs/FINANCIAL_REPORTING_DEFINITIONS.md`.

## 22. Testes unitários

`npm run test:finance -w @ecopet/web` — **16/16 pass** (money, allocation, auth contracts, pricing).

## 23. Testes de integração

Hooks em webhook PAID + refund path; E2E script cobre fluxo composto.

## 24. E2E local

`scripts/test-fase3-financial-flow.mjs` contra `npm run dev`: **16/16 steps OK** (ledger, saldo, release, payout sandbox PAID, refund, chargeback, conciliação RECONCILED, IDOR 403, cliente negado no ledger).

`npm run start` (NODE_ENV=production) falhou no instrumentation existente se `ALLOW_SIMULATED_PAYMENTS=true` — gate pré-existente; E2E financeiro validado em `dev`.

## 25. E2E Preview

**Não executado** — Fase 2.2 bloqueada (Root Directory / isolamento DB).

## 26. Migrations

| Migration | Conteúdo |
| --------- | -------- |
| `20260806180000_fase3_financial_ledger` | Order snapshot estendido, PlatformSettings financeiros, LedgerAccount, ledger, reserve, payout, chargeback, reconciliation, adjustments |

Rollback lógico: flags off; **não** dropar tabelas/migration.

## 27. Variáveis de ambiente

| Flag | Preview sugerido | Production |
| ---- | ---------------- | ---------- |
| FINANCIAL_LEDGER_ENABLED | true | false até homologação |
| PAYOUTS_ENABLED | true | false |
| MANUAL_PAYOUT_APPROVAL_REQUIRED | true | true |
| RESERVE_ENABLED | true | false até homologação |
| CHARGEBACKS_ENABLED | true | false até homologação |
| DAILY_RECONCILIATION_ENABLED | false | false |

## 28. Feature flags

Implementadas em `apps/web/src/lib/finance/flags.ts` (env; Production Vercel default off).

## 29. Erros restantes

- Preview / webhook externo / isolamento DB homologação
- Dupla aprovação de ajuste: fluxo PENDING_APPROVAL sem UI completa de segundo aprovador
- Consumo de payout exige lançamentos AVAILABLE que caibam integralmente no valor (sem split parcial de lançamento)
- Testes de concorrência automatizados limitados (unicidade DB + transações)

## 30. Riscos financeiros

- Política de bearer gateway / reembolso **provisória**
- Float legado em Order/Payment; ledger em Int cents
- Fase 2.2 bloqueada → risco de homologar em DB compartilhado se Preview for forçado

## 31. Arquivos alterados (principais)

- `packages/database/prisma/schema.prisma` + migration Fase 3
- `apps/web/src/lib/finance/**`
- checkout, apply-payment-status, refunds
- APIs admin/partner financeiro
- painéis partner/admin
- docs Fase 3 + accounting/tax/reporting/rollback
- `scripts/test-fase3-financial-flow.mjs`

## 32. Procedimento de rollback

Ver `docs/FASE_3_ROLLBACK.md`.

## 33. Veredito

```text
FASE 3 PARCIALMENTE CONCLUÍDA
PRONTO PARA HOMOLOGAÇÃO FINANCEIRA
```

Não `PRONTO PARA PILOTO FINANCEIRO CONTROLADO` porque:

- [x] ledger validado (unit + E2E local)
- [x] split lógico validado
- [x] saldo derivável pelo ledger
- [x] reserva / reembolso / chargeback / repasse sandbox no E2E local
- [ ] E2E Preview aprovado — **bloqueado pela Fase 2.2**
- [x] nenhuma credencial de produção para cobrança/repasse real
- [x] nenhum repasse real executado

**Próximo passo:** desbloquear Preview (Fase 2.2), repetir E2E financeiro no Preview com DB de homologação isolado.
