# Fase 3.1 — Homologação financeira externa em Preview — Resultado

**Branch:** `test/fase-3-1-financial-preview`  
**Atualizado:** 2026-08-08 (desbloqueio RATE_LIMIT E2E Preview + E2E Fase 2/3)  
**Projeto:** `ecopet-s-projects/ecopet-web`  
**Produção:** `https://www.eccopet.com` (**não** alterada)  
**Deploy Preview:** `https://ecopet-aczl1xzeh-ecopet-s-projects.vercel.app` → alias `https://homolog.eccopet.com`

---

## 1. Resumo executivo

```text
FASE 3.1 PARCIALMENTE CONCLUÍDA — NÃO LIBERADO PARA PILOTO
```

Bloqueio **HTTP 429 RATE_LIMIT** no login E2E Preview foi **resolvido** com gate E2E fail-closed exclusivo de Preview.  
E2E **Fase 2** externo em homolog: **24/24, exit 0** (sem 429).  
E2E **Fase 3** financeiro (ledger/payout/refund/chargeback/conciliação via apply autorizado local): **16/16, exit 0**.

Ainda **não** liberado para piloto: falta cobrança Mercado Pago sandbox real e suite de webhook externo ponta a ponta (além das validações já cobertas pelo E2E Fase 3 com `applyInternalPaymentStatus`).

---

## 2. Auditoria RATE_LIMIT (causa do 429)

| Item | Detalhe |
| ---- | ------- |
| Endpoint | `apps/web/src/app/api/auth/login/route.ts` |
| Helper | `checkDistributedRateLimit` em `apps/web/src/lib/rate-limit.ts` |
| Storage | memória do processo **+** Postgres `RateLimitBucket` (serverless-safe) |
| Limite login | `10` / janela `15 * 60 * 1000` ms |
| Chaves | `login:${ip}` e `login:id:${identifier}` |
| IP | `clientIp()` preferia `x-vercel-forwarded-for` (edge) sobre `x-forwarded-for` do runner |
| Envs legadas | `AUTH_RATE_LIMIT_DISABLED` / `AUTH_RATE_LIMIT_RELAXED` (não aplicam no Preview Vercel: `NODE_ENV=production` + `VERCEL=1`) |

**Causa:** o runner E2E rotacionava `x-forwarded-for`, mas no Preview a Vercel injeta `x-vercel-forwarded-for`. Todos os logins compartiam o **mesmo edge IP** → esgotavam o bucket 10/15min após corridas repetidas.  
`VERCEL_AUTOMATION_BYPASS_SECRET` **não** foi reutilizado para rate-limit (só Deployment Protection).

---

## 3. Solução adotada (E2E Preview fail-closed)

Arquivos principais:

- `apps/web/src/lib/e2e-preview-auth.ts` — gate  
- `apps/web/src/lib/rate-limit.ts` — `clientIpForRateLimit`  
- `apps/web/src/app/api/auth/login/route.ts` / `register/route.ts` — skip RL só se autorizado  
- `apps/web/src/app/api/auth/test/e2e-gate/route.ts` — diagnóstico Preview-only  
- `scripts/http-with-vercel-bypass.mjs` — header `x-ecopet-e2e-test` (secret separado)

Condições **todas** obrigatórias (fail-closed):

1. `VERCEL_ENV === "preview"` (Production impossível)  
2. `E2E_TEST_MODE === "true"`  
3. Header `x-ecopet-e2e-test` === `E2E_TEST_SECRET` (Preview-only)  
4. Secret ausente / header ausente / header errado → **sem** privilégio  

Quando autorizado:

- login/register **não** aplicam o rate-limit de auth (carga E2E controlada)  
- `clientIpForRateLimit` preferem `x-forwarded-for` sintético  

Quando **não** autorizado (Preview normal / Production):

- limites originais intactos  
- Production ignora qualquer bypass E2E  
- `validate-production-env` rejeita `E2E_TEST_MODE` / `E2E_TEST_SECRET` em Production  

Env Preview (Dashboard/CLI, **não** Production):

- `E2E_TEST_MODE=true`  
- `E2E_TEST_SECRET=<secret separado>`  

Runner local (`apps/web/.env.e2e.local`, gitignored): mesmos valores + `VERCEL_AUTOMATION_BYPASS_SECRET` + DB homolog.

---

## 4. Testes de segurança (rate-limit E2E)

`apps/web/src/lib/e2e-preview-auth.test.ts` — **13 pass**:

- Production ignora bypass E2E  
- Preview normal respeita edge IP / sem autorização  
- Preview E2E autorizado  
- Preview sem secret / sem header / header errado → fail-closed  
- Production nunca faz skip de rate limit E2E  

Probe em homolog (pós-deploy): login com header E2E → `401 INVALID_CREDENTIALS` (não 429); burst 12 IPs → 0×429.

---

## 5. Deploy Preview

| Item | Valor |
| ---- | ----- |
| `--prod` | não |
| Projeto | `ecopet-web` |
| Deployment | `ecopet-aczl1xzeh-ecopet-s-projects.vercel.app` |
| Alias | `homolog.eccopet.com` |
| Health | 200 · `database: connected` · `service: ecopet-web` |
| Gate diag | `GET /api/auth/test/e2e-gate` → `authorized: true` com header |

---

## 6. E2E Fase 2 (homolog) — completo

```text
WEB_URL=https://homolog.eccopet.com
node --import tsx --env-file=apps/web/.env.e2e.local --require ./apps/web/scripts/stub-server-only.cjs scripts/test-fase2-commercial-flow.mjs
```

| Métrica | Valor |
| ------- | ----- |
| Total | 24 |
| Pass | 24 |
| Fail | 0 |
| Exit code | **0** |
| 429 | nenhum |

Observações:

- Turnstile dummy no register **e** no login (risco após probes).  
- Express local ausente → `neg_express_legacy` skipped (opcional); proxy Next 503 ok.  
- Pagamento: `applyInternalPaymentStatus` local (não cobrança MP sandbox nesta corrida).

---

## 7. E2E Fase 3 (homolog) — completo

```text
WEB_URL=https://homolog.eccopet.com
# ledger local exige DIRECT_URL (pooler :6543 quebra interactive transaction)
DATABASE_URL=<DIRECT_URL homolog>
node --import tsx --env-file=apps/web/.env.e2e.local --require ./apps/web/scripts/stub-server-only.cjs scripts/test-fase3-financial-flow.mjs
```

| Métrica | Valor |
| ------- | ----- |
| Total | 16 |
| Pass | 16 |
| Fail | 0 |
| Exit code | **0** |

Cobertura nesta corrida: ledger, saldo bloqueado/disponível, payout sandbox-flag, refund/reversão, chargeback, reconciliação, IDOR/audit.  
**Não** substitui cobrança MP sandbox real nem webhook HTTPS externo do MP.

Primeira tentativa com `DATABASE_URL` pooler `:6543` falhou em `LEDGER_POST_FAILED` (Prisma interactive transaction); reexecução com `DIRECT_URL` (`:5432`) passou.

---

## 8. Desbloqueio restante (piloto)

Ainda pendente para **não** classificar como pronto para piloto:

1. Cobrança Mercado Pago **sandbox real** (checkout → MP → pagamento teste)  
2. Webhook **externo** MP → Preview (assinatura + idempotência ponta a ponta)  
3. Revalidar ledger/payout/refund/chargeback/conciliação sob esse caminho externo  

---

## 9. Constraints

- [x] Sem Production / `--prod` / merge `main` / commit automático  
- [x] Sem desligar rate limit globalmente  
- [x] Sem reutilizar `x-vercel-protection-bypass` como bypass de rate-limit  
- [x] Gate E2E impossível em Production  
- [x] Secrets não impressos  
- [x] Não classificado como pronto para piloto  
