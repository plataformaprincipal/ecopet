# Fase 3.2 — Gate final de piloto financeiro controlado — Resultado

**Branch:** `test/fase-3-1-financial-preview`  
**Commit local/remoto:** `b0b2335` — `fix: finalize sandbox refund and financial reconciliation`  
**Projeto Vercel:** `ecopet-s-projects/ecopet-web`  
**Produção:** `https://www.eccopet.com` (**não** alterada)  
**Data:** 2026-08-08 (horário de Brasília)  
**Alias:** `https://homolog.eccopet.com`

---

## Veredito

```text
GATE CONDICIONAL — PILOTO SOMENTE COM POLLING E ACOMPANHAMENTO MANUAL
```

Motivo bloqueante do gate integral: **entrega NATURAL do webhook Mercado Pago → Preview não comprovada** na janela de observação (`WEBHOOK DELIVERY NOT PROVEN`).

A cadeia financeira ponta a ponta (cobrança sandbox real → poll server-side → PAID → ledger → reserve → partner payable → idempotência → refund sandbox real → reconciliation `RECONCILED`) **funcionou** com fallback de polling. Chargeback permanece **INTERNO CONTROLADO**.

---

## 1. Deployment

| Item | Valor |
| ---- | ----- |
| Projeto | `ecopet-web` |
| Target | Preview (`--prod` **não** usado) |
| Deployment | `dpl_Bizqaanjrbi2SB9gEaHLN4X1LGn7` |
| URL | `https://ecopet-dobv4eo27-ecopet-s-projects.vercel.app` |
| Alias | `homolog.eccopet.com` → deployment acima |
| Meta Git na API Vercel | vazia (upload CLI); **runtime `release` nos logs = `b0b2335…`** |

## 2. Commit

`b0b2335` (`b0b2335069bd2c72ca8362506aea87fbfc6dce41`) confirmado nos logs estruturados do runtime Preview (`release`).

## 3. Health / runtime

| Check | Resultado |
| ----- | --------- |
| `GET /api/health` | **200** |
| `database` | **connected** |
| `MERCADO_PAGO_ENVIRONMENT` | **test** (`TEST_READY`) |
| Public Key runtime | prefixo `APP_USR-02…` |
| `ALLOW_SIMULATED_PAYMENTS` | fail-closed / sem IDs `sim_*` / `mock_*` / `fake_*` na cobrança |

## 4. Pedido sandbox (pré-pagamento)

| Campo | Valor |
| ----- | ----- |
| Order status | `PENDING_CONFIRMATION` (domínio não usa `PENDING_PAYMENT`) |
| Payment status | `PENDING` |
| Snapshot / itens | 1 item persistido |
| Amount server-side | `50` |
| `PAYMENT_RECEIVED` | **0** |
| Ledger | **0** |
| Reserve | **nenhuma** |

## 5. Cobrança externa

| Campo | Valor |
| ----- | ----- |
| API | Orders (`POST /v1/orders` via backend `/api/checkout/mercado-pago/order`) |
| Meio | cartão teste **visa** |
| Payer | `*@testuser.com` |
| Amount | server-side `50` |
| `external_reference` | `ecopet_<orderId>` |
| Idempotency | key de create no backend |
| HTTP create | **201** |
| Status externo | `accredited` (persistido `PROCESSING` até confirmação async) |

## 6. Provider IDs (sanitizados)

| ID | Prefixo / evidência |
| -- | ------------------- |
| Provider Order | `ORDTST01…65P9` (`ORDTST01KZHX2HTPB90NY53GS3DN65P9`) |
| Provider Payment | `PAY01KZH…S3KC` (`PAY01KZHX2HV8GWB8RHR1E47DS3KC`) |
| Provider Refund | `REF01KZH…BJ6Y3` (`REF01KZHXC58T6WA59B9MS98BJ6Y3`) |
| Proibidos | nenhum `sim_*` / `mock_*` / `fake_*` |

## 7. Webhook natural

| Item | Resultado |
| ---- | --------- |
| Janela | **180s** após create, **sem poll** e **sem webhook assinado interno** |
| Evento `mpWebhookEvent` para ORD/PAY do pedido | **não encontrado** |
| POST natural nos logs Vercel na janela | **não observado** |
| Classificação | **`WEBHOOK DELIVERY NOT PROVEN`** |

Configuração esperada no painel MP (teste):

`https://homolog.eccopet.com/api/webhooks/mercado-pago?x-vercel-protection-bypass=<secret>`

Bypass Vercel **apenas** atravessa Deployment Protection. **Não** substitui assinatura MP, consulta server-side ao provider, validação de amount nem `external_reference`.

Provas de proteção (não são entrega natural):

| Probe | Resultado |
| ----- | --------- |
| Webhook bare (sem bypass) | **302** SSO |
| Webhook `?x-vercel-protection-bypass=` GET | **200** (alcançável) |
| Assinatura inválida (POST) | **401** |

## 8. Timestamps (UTC)

| Evento | Timestamp |
| ------ | --------- |
| Cobrança / create MP | `2026-08-08T23:59:30Z` (~20:59 BRT) |
| Status externo `accredited` | imediato no create (`statusDetail=accredited`) |
| Fim da janela natural (180s) | ~`2026-08-09T00:02:30Z` |
| Webhook natural | **não chegou** |
| Poll fallback | ~`2026-08-09T00:02:34Z` (log `GET …/order/cmsl1ci…`) |
| Refund / recon | após poll (mesma sessão de fechamento) |

## 9. Assinatura / origem

- Replay assinado legítimo (pós-PAID): **200**, ledger estável  
- Assinatura inválida: **401** (`SIGNATURE_MISMATCH`)  
- Bypass query ≠ autenticação MP

## 10. Amount / external_reference

Validação server-side no caminho de apply (poll/webhook): amount e referência do pedido homolog; sem mutação por payload cliente.

## 11. Payment / Order

| Antes (pré-poll) | Depois (poll) |
| ---------------- | ------------- |
| Order `PENDING_CONFIRMATION` | Order **`PAID`** |
| Payment `PROCESSING` (`accredited`) | Payment **`APPROVED`** |

## 12. Ledger

5 entries: `PAYMENT_RECEIVED`, `PLATFORM_COMMISSION`, `GATEWAY_FEE_ESTIMATED`, `PARTNER_PAYABLE`, `RESERVE_HOLD`  
`PAYMENT_RECEIVED` = **1** (sem duplicata)

## 13. Reserve

`FinancialReserve` status **`HELD`** (`amountCents=88` no pedido 50)

## 14. Partner payable

1× `PARTNER_PAYABLE` no ledger; sem duplicata após replays

## 15. Idempotência

| Teste | Resultado |
| ----- | --------- |
| Reenvio webhook assinado | ledger 5 → **5** |
| Uma transição PAID | sim |
| Um `PAYMENT_RECEIVED` | sim |
| Uma reserve | sim |
| Estoque/ledger duplicado | **não** |

## 16. Cold start

Nova consulta Prisma + wake `/api/health` após PAID: Payment `APPROVED`, ledger 5 persistidos; reenvio idempotente entre “instâncias” de consulta.

## 17. Refund sandbox real

| Campo | Valor |
| ----- | ----- |
| Via | admin estornos → Orders API refund |
| HTTP | **200** |
| Payment | **`REFUNDED`** (`refundedAmount=50`) |
| Provider Refund ID | `REF01KZHXC58T6WA59B9MS98BJ6Y3` |
| Status refund row | `FULLY_REFUNDED` |

## 18. Chargeback

**INTERNO CONTROLADO** (HTTP 200 no admin).  
**Não** apresentado como chargeback externo/adquirente do sandbox MP.

## 19. Reconciliation

Pós-refund: **`RECONCILED`** (HTTP 200)

## 20. Regressão Fase 2 / Fase 3

| Suite | Resultado |
| ----- | --------- |
| Fase 2 @ homolog | **24/24 · exit 0** |
| Fase 3 @ homolog | **16/16 · exit 0** |

## 21. Logs (Vercel Preview)

Observado durante create / poll / fluxo:

- Runtime `release=b0b2335…`
- Create MP e poll GET presentes
- **Ausência** de POST natural `/api/webhooks/mercado-pago` na janela do pedido gate
- Erros SMTP/`EMAIL_FORBIDDEN` em e-mails de cadastro/pedido (não financeiros; não 500 de ledger)
- Sem evidência de secret/token MP exposto nos trechos revisados
- Sem Prisma error no caminho financeiro do gate
- Sem ledger duplicado

## 22. Riscos restantes

1. **Webhook natural MP → homolog não comprovado** — painel pode estar sem bypass na URL, ou entregas sandbox não chegando; piloto exige polling/manual até prova natural.  
2. SMTP Preview com credencial rejeitada (`535`) — operacional, fora do ledger.  
3. Chargeback externo sandbox ainda indisponível.  
4. Deploy CLI sem meta Git na API — mitigado por `release` nos logs = `b0b2335`.

## 23. Constraints respeitadas

- [x] Sem merge em `main`  
- [x] Sem deploy Production  
- [x] Sem commit automático  
- [x] Sem revelar secrets / bypass / tokens  
- [x] Sem simular webhook como prova de entrega natural  

---

```text
GATE CONDICIONAL — PILOTO SOMENTE COM POLLING E ACOMPANHAMENTO MANUAL
```
