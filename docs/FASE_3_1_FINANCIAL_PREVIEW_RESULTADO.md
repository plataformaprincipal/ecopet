# Fase 3.1 — Homologação financeira externa em Preview — Resultado

**Branch:** `test/fase-3-1-financial-preview`  
**Git HEAD / meta deploy:** `21cb91e` — `test: harden preview e2e authentication flow`  
**Atualizado:** 2026-08-08 (credenciais Teste + cobrança sandbox real + refund Orders + recon)  
**Projeto:** `ecopet-s-projects/ecopet-web`  
**Produção:** `https://www.eccopet.com` (**não** alterada)  
**Deploy Preview (último):** `https://ecopet-ez8rfl22j-ecopet-s-projects.vercel.app`  
**Alias:** `https://homolog.eccopet.com` → mesmo deployment (`sha=21cb91e`)

> Nota: o deploy Preview inclui patches locais não commitados (parse de erros Orders, refund `POST /v1/orders/{id}/refund`, reconciliação aceitando `FULLY_REFUNDED`). Sem merge em `main`, sem commit automático, sem Production.

---

## 1. Resumo executivo

```text
FASE 3.1 CONCLUÍDA — PRONTO PARA PILOTO FINANCEIRO CONTROLADO
```

| Etapa | Resultado |
| ----- | --------- |
| Deploy Preview @ meta `21cb91e` | OK |
| `homolog.eccopet.com` | OK (alias no deployment atual) |
| `/api/health` | 200 · `database: connected` |
| Runtime `MERCADO_PAGO_ENVIRONMENT` | **`test`** / `TEST_READY` |
| Credencial MP (Teste) | Aceita; Public Key runtime `APP_USR-02…` |
| `ALLOW_SIMULATED_PAYMENTS` | **false** (fail-closed; cobranças reais sandbox) |
| Cobrança sandbox real | **OK** (`ORDTST…` / `PAY01…`) |
| Payment/Order PAID | **OK** (poll server-side MP) |
| Ledger / reserve / partner payable / audit | **OK** |
| Webhook assinatura inválida | **401** |
| Webhook duplicado | **idempotente** (ledger estável) |
| Refund sandbox real (Orders API) | **OK** → Payment `REFUNDED` |
| Chargeback | **INTERNO CONTROLADO** |
| Reconciliation cenário normal | **`RECONCILED`** |
| Reconciliation pós-refund | **`RECONCILED`** (após correção status `FULLY_REFUNDED`) |
| E2E Fase 2 | **24/24 · exit 0** |
| E2E Fase 3 | **16/16 · exit 0** |

---

## 2. Deploy / health

| Item | Valor |
| ---- | ----- |
| `--prod` | não |
| Projeto | `ecopet-web` |
| Git commit (API Vercel) | `21cb91e900ca6313af1698d4477667a2dfd5c438` |
| URL | `https://ecopet-ez8rfl22j-ecopet-s-projects.vercel.app` |
| Alias | `homolog.eccopet.com` |
| Health | 200 · `database: connected` |

Credenciais antigas de cache local **não** foram usadas para cobrança (Access Token/Public Key locais removidos do process; tokenização com Public Key **runtime**).

---

## 3. Runtime MP (sem secrets)

| Check | Resultado |
| ----- | --------- |
| `GET /api/checkout/mercado-pago/config` | `environment=test`, `status=TEST_READY`, Public Key `APP_USR-02…` |
| Mesmo conjunto Teste | Sandbox exige payer `@testuser.com` (`invalid_email_for_sandbox` com gmail); cartão teste + Access Token runtime fecham cobrança |
| Admin probe / create charges | Token aceito (cobranças e refunds reais) |
| `ALLOW_SIMULATED_PAYMENTS` | presente no Preview; valor efetivo fail-closed / `false` no verify local; nenhum `sim_*` |

---

## 4. Cobrança sandbox real (evidência)

Endpoint MP: `POST https://api.mercadopago.com/v1/orders`  
Backend: `POST /api/checkout/mercado-pago/order`

| Campo | Valor |
| ----- | ----- |
| Meio | `visa` (cartão oficial de teste; tokenização OK) |
| Payer e-mail | `*@testuser.com` |
| Amount | server-side (`50`) |
| `external_reference` | `ecopet_<orderId>` |
| Provider Order ID | `ORDTST01KZHTNSHYRJJNH6XX2K0N3ER4` (prefixo real de teste) |
| Provider Payment ID | `PAY01KZHTNSJQG3SACJ9TPGM275M5` |
| Status externo | `accredited` / mapped APPROVED → persistido PROCESSING até poll |
| Após poll | Payment **APPROVED**, Order **PAID** |
| IDs proibidos | nenhum `sim_*` / `mock_*` / `fake_*` |

Pedido homolog anterior (mesmo fluxo): `ORDTST01KZHSYC2ZQ6W1G8RCAGYS5NT3` / `PAY01KZHSYC3JH1Y80FRCCHKCQHTE`.

Master teste retornou `invalid_transaction_amount` nesta conta; **visa** aprovou.

---

## 5. Cadeia financeira pós-aprovação

| Passo | Evidência |
| ----- | --------- |
| Poll server-side MP | `GET /api/checkout/mercado-pago/order/:paymentId` → APPROVED |
| Ledger | 5 entries: `PAYMENT_RECEIVED`, `PLATFORM_COMMISSION`, `GATEWAY_FEE_ESTIMATED`, `PARTNER_PAYABLE`, `RESERVE_HOLD` |
| Reserve | `FinancialReserve` status `HELD` |
| Partner payable | balances blocked `43.75` (pedido 50) |
| Audit | registros presentes |
| Webhook bare | 302 SSO |
| Webhook `?x-vercel-protection-bypass=` | 200 (só atravessa SSO) |
| Assinatura inválida | 401 |
| Webhook duplicado assinado | 200 · ledger count inalterado |
| Entrega natural MP→Preview | não observada na janela curta — configurar no painel MP a URL com bypass query |

Bypass Vercel **não** substitui assinatura MP, amount, `external_reference`, auth interna nem ledger.

---

## 6. Refund / chargeback / reconciliação

| Teste | Resultado |
| ----- | --------- |
| Refund sandbox | `POST /v1/orders/{order_id}/refund` via admin estornos → Payment `REFUNDED` amount 50 |
| Chargeback admin | **INTERNO CONTROLADO** (HTTP 200) |
| Chargeback adquirente sandbox | **NÃO SUPORTADO PELO SANDBOX** / não exercitado como fluxo externo MP |
| Recon cenário normal (PAID) | **`RECONCILED`** |
| Recon pós-refund | **`RECONCILED`** |

---

## 7. E2E Fase 2 / Fase 3 (repetidos)

| Suite | Total | Pass | Fail | Exit |
| ----- | ----- | ---- | ---- | ---- |
| Fase 2 | 24 | 24 | 0 | **0** |
| Fase 3 | 16 | 16 | 0 | **0** |

---

## 8. Ops recomendadas para piloto controlado

1. Manter no painel MP (homolog) a URL:  
   `https://homolog.eccopet.com/api/webhooks/mercado-pago?x-vercel-protection-bypass=<secret>`  
2. Payer sandbox sempre `*@testuser.com`.  
3. Preferir cartão visa de teste nesta conta (master falhou com `invalid_transaction_amount`).  
4. Não promover as mesmas credenciais Teste para Production.  
5. Patches Preview (refund Orders + recon `FULLY_REFUNDED` + parse de erros) commitados nesta branch após autorização.

---

## 9. Constraints

- [x] Sem deploy Production  
- [x] Sem merge `main`  
- [x] Commit apenas dos patches autorizados (sem secrets / sem `_tmp-*`)  
- [x] Sem revelar credenciais  
- [x] Pronto para piloto financeiro **controlado** em Preview/homolog  
