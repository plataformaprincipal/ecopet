# Fase 3.1 — Homologação financeira externa em Preview — Resultado

**Branch:** `test/fase-3-1-financial-preview`  
**Data:** 2026-08-06  
**Projeto canônico:** `ecopet-s-projects/ecopet-web`  
**Produção:** `https://www.eccopet.com` (**não** alterada)

---

## 1. Resumo executivo

A Fase 3.1 foi **iniciada e bloqueada** antes de deploy, migrations no Preview e E2E externo. O isolamento Preview/Production de `DATABASE_URL` / `DIRECT_URL` **não foi comprovado** (variáveis no mesmo escopo Vercel; pull sensível redigido). A especificação exige encerrar sem migrar/homologar em banco duvidoso.

Código da Fase 3 permanece **não commitado** no working tree (pré-condição de tree limpo não atendida; commit não automático).

## 2. Git e branch

| Item | Estado |
| ---- | ------ |
| Branch | `test/fase-3-1-financial-preview` (criada a partir de `feat/fase-3-financial-ledger`) |
| HEAD base | `0646e06` (Fase 2 consolidada) |
| Working tree | **Sujo** — alterações Fase 3 (ledger, APIs, docs, migration) não commitadas |
| `tsconfig.tsbuildinfo` | Modificado localmente — **não** deve versionar |
| Secrets / `.env*` | Não versionados; pulls em `apps/web/.env.*.pull` gitignored |
| Migration Fase 3 no disco | `packages/database/prisma/migrations/20260806180000_fase3_financial_ledger/` (untracked) |
| Merge `main` | Não |
| Commit automático | Não |

Pré-condições da especificação:

| Check | Status |
| ----- | ------ |
| Working tree limpo | **Não** |
| Fase 3 commitada | **Não** |
| Migration Fase 3 rastreada no Git | **Não** (arquivo local untracked) |
| Secrets versionados | Não observados |
| `.env` versionado | Não |
| Branch de restauração | `feat/fase-3-financial-ledger` / `0646e06` disponível |

## 3. Isolamento de ambientes

Ver `docs/FASE_3_1_ENVIRONMENT_ISOLATION.md`.

**Resultado:** `DATABASE_ISOLATION_FAILED` / não comprovado → **bloqueio duro**.

## 4. Configuração Vercel

Inspecionado via `vercel project inspect ecopet-web` (cwd `apps/web`, link correto):

| Campo | Valor observado |
| ----- | --------------- |
| Project | `ecopet-web` (`prj_s0bPVSphC7jzVfodZswqxQ3nyL4u`) |
| Root Directory | `apps/web` |
| Framework Preset | Next.js |
| Output Directory | Next.js default (não `public`) |
| Node.js | 24.x |
| Build / Install (painel) | Defaults genéricos no inspect (`npm run build` / package manager default) — `apps/web/vercel.json` ainda declara `cd ../.. && npm ci/build` |
| Projeto acidental | `ecopet_github` ainda existe no team — **não** usar |
| Link raiz `.vercel` | Aponta para `ecopet_github` — **não** usar para deploy |
| Link `apps/web/.vercel` | Aponta para `ecopet-web` — correto |

Risco residual Fase 2.2: deploy a partir de `apps/web` com Root=`apps/web` pode gerar path `apps/web/apps/web`. Deploy Preview **não** executado nesta fase.

Atualização em `docs/VERCEL_DEPLOYMENT_CONFIGURATION.md`.

## 5. Variáveis e feature flags

| Variável / flag | Preview | Nota |
| --------------- | ------: | ---- |
| `DATABASE_URL` / `DIRECT_URL` | Presente (compartilhado c/ Prod) | Bloqueante |
| `MERCADO_PAGO_*` | Presente (compartilhado) | TEST não comprovado (pull redigido) |
| `ALLOW_SIMULATED_PAYMENTS` | Ausente | OK |
| `FINANCIAL_LEDGER_ENABLED` | **Ausente** | Não configurado |
| `PAYOUTS_ENABLED` | **Ausente** | Não configurado |
| `MANUAL_PAYOUT_APPROVAL_REQUIRED` | **Ausente** | Default código = true se lido localmente |
| `RESERVE_ENABLED` / `CHARGEBACKS_ENABLED` | **Ausente** | — |
| `DAILY_RECONCILIATION_ENABLED` | **Ausente** | Default false no código |

Comportamento do código (`flags.ts`): em Preview/local, ledger/payouts default **on** se env ausente — **não** fail-closed estrito no Preview. Em Production Vercel, default off. Homologação externa exigiria flags explícitas e revisão de fail-closed (fora do escopo de “só validar” enquanto bloqueado).

## 6. Migrations

| Ação | Status |
| ---- | ------ |
| `migrate deploy` no DB de homologação | **Não executado** (isolamento não comprovado) |
| `migrate reset` | Não |
| Migration Fase 3 no Git | Ainda untracked |
| Schema local | Contém modelos Fase 3 |

## 7. Deploy Preview

**Não executado** — bloqueado por isolamento de banco + working tree Fase 3 não commitada + risco Root Directory.

## 8. Smoke test

Não executado (sem URL Preview nova).

## 9. E2E comercial

Não executado em Preview.

## 10. E2E financeiro

Não executado em Preview. (E2E local Fase 3: 16/16 em sessão anterior — **não** substitui Preview.)

## 11. Cobrança sandbox externa

Não executada.

## 12. Webhook externo

Não configurado / não validado.

## 13–23. Ledger / split / reserva / saldos / payout / refund / chargeback / conciliação / taxas / concorrência / serverless

Não homologados externamente nesta fase.

## 24. Autorizações

Não retestadas via HTTP Preview.

## 25. CSV

Não testado em Preview.

## 26. Logs da Vercel

Sem deploy novo — sem revisão de logs desta fase.

### Incidentes / bloqueios encontrados

| ID | Severidade | Achado |
| -- | ---------- | ------ |
| B1 | Crítico | `DATABASE_URL`/`DIRECT_URL` no mesmo escopo Preview+Production |
| B2 | Crítico | Pull Vercel redige secrets — não prova host DB nem MP TEST |
| B3 | Alto | Fase 3 não commitada / tree sujo |
| B4 | Alto | Flags financeiras ausentes no Preview |
| B5 | Médio | Projeto `ecopet_github` acidental ainda no team |
| B6 | Médio | Root Directory `apps/web` + deploy a partir de subpasta = risco path duplicado |
| B7 | Médio | Flags financeiras default-on fora de Production Vercel (não fail-closed no Preview) |

## 27. Rollback

Exercício Preview (desligar `PAYOUTS_ENABLED` etc.) **não** executado — sem deploy.  
Procedimento permanece em `docs/FASE_3_ROLLBACK.md` (sem nova evidência externa).

## 28. Testes executados

| Teste | Ambiente | Resultado |
| ----- | -------- | --------- |
| `git status` / branch / log | Local | Tree sujo; branch 3.1 criada |
| `vercel whoami` / `project ls` / `env ls` | Remoto | OK (nomes) |
| `vercel env pull` preview+production | Remoto→local | Pull OK; valores sensíveis redigidos |
| `vercel project inspect ecopet-web` | Remoto | Root=`apps/web`, Next, Node 24, Output default |
| Compare isolation script | Local | **Falha isolamento** / não comprovável |
| Deploy / E2E Preview | — | **Não executado** |
| `npm ci` / lint / build / test finais | — | Não reexecutados nesta fase (bloqueio anterior) |

## 29. Falhas restantes

1. Banco de homologação exclusivo não comprovado.  
2. Credenciais MP TEST no Preview não comprovadas.  
3. Fase 3 ainda fora do Git.  
4. Preview financeiro não publicado.  
5. Webhook externo não apontado.

## 30. Riscos financeiros

- Homologar no banco atual do Preview pode **escrever ledger/payouts em Production**.  
- Tokens MP compartilhados podem misturar sandbox e live.  
- Qualquer `migrate deploy` sem isolamento é risco destrutivo de schema.

## 31. Arquivos alterados / criados (esta fase)

- `docs/FASE_3_1_ENVIRONMENT_ISOLATION.md`
- `docs/FASE_3_1_FINANCIAL_PREVIEW_RESULTADO.md` (este)
- `docs/VERCEL_DEPLOYMENT_CONFIGURATION.md` (atualização)
- `scripts/compare-preview-production-env.mjs`
- `scripts/inspect-env-pull-meta.mjs`
- Branch `test/fase-3-1-financial-preview`
- Working tree Fase 3 herdado (não commitado)

## 32. Veredito

```text
FASE 3.1 BLOQUEADA
PRONTO PARA HOMOLOGAÇÃO FINANCEIRA
```

Não avançar para `PRONTO PARA PILOTO FINANCEIRO CONTROLADO`.

Checklist piloto (todos precisam de evidência externa):

```text
[ ] banco de homologação isolado          → FALHOU / não comprovado
[ ] deploy Preview funcional              → não executado
[ ] E2E comercial externo aprovado        → não executado
[ ] E2E financeiro externo aprovado       → não executado
[ ] cobrança sandbox real                 → não executado
[ ] webhook externo real                  → não executado
[ ] ledger idempotente (externo)          → não executado
[ ] demais itens financeiros externos     → não executados
[x] nenhum repasse real
[x] nenhum deploy Production
```

### Desbloqueio mínimo

1. Commit seguro da Fase 3 (após autorização explícita).  
2. Postgres de homologação separado + env Preview exclusivo.  
3. MP TEST comprovado no Preview.  
4. Flags financeiras Preview explícitas.  
5. Deploy Preview a partir da raiz / Root Directory corrigido no `ecopet-web`.  
6. `migrate deploy` **só** no DB de homologação.  
7. Repetir E2E comercial + financeiro com `WEB_URL` Preview.
