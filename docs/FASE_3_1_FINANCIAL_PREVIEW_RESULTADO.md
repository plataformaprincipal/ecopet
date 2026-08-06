# Fase 3.1 — Homologação financeira externa em Preview — Resultado

**Branch:** `test/fase-3-1-financial-preview`  
**Atualizado:** 2026-08-06 (estado Git corrigido + preparação de infraestrutura)  
**Projeto canônico:** `ecopet-s-projects/ecopet-web`  
**Produção:** `https://www.eccopet.com` (**não** alterada)

---

## 1. Resumo executivo

A Fase 3.1 permanece **bloqueada** exclusivamente por **infraestrutura** (isolamento de banco e credenciais TEST não comprovados; URL Preview estável ainda não validada).

O código da Fase 3 **já está commitado**. Nenhuma migration Preview, deploy Preview financeiro, cobrança sandbox ou webhook externo foi executado nesta preparação.

## 2. Git e branch (corrigido)

| Item | Estado |
| ---- | ------ |
| Branch | `test/fase-3-1-financial-preview` |
| Working tree | **Limpo** (no momento da correção documental) |
| Fase 3 | Commit **`84d1b67`** — `feat: implement financial ledger and reconciliation foundation` |
| Higienização tsbuildinfo | Commit **`0c6a97b`** — `chore: ignore TypeScript build info files` |
| Migration Fase 3 | **Rastreada** em `packages/database/prisma/migrations/20260806180000_fase3_financial_ledger/` |
| Secrets / `.env*` / `.vercel` | Não versionados |
| Merge `main` | Não |
| Deploy Production | Não |
| Credenciais de produção utilizadas | **Nenhuma** nesta fase |

Pré-condições Git:

| Check | Status |
| ----- | ------ |
| Working tree limpo | **Sim** |
| Fase 3 commitada | **Sim** (`84d1b67`) |
| Migration Fase 3 rastreada no Git | **Sim** |
| `.tsbuildinfo` ignorado / fora do índice | **Sim** (`0c6a97b`) |

## 3. Isolamento de ambientes

Ver `docs/FASE_3_1_ENVIRONMENT_ISOLATION.md`.

**Resultado:** isolamento Preview/Production **ainda não comprovado** → bloqueio duro.

Motivos vigentes:

```text
banco de homologação isolado ainda não comprovado;
credenciais Mercado Pago TEST ainda não comprovadas;
URL Preview estável ainda não validada.
```

## 4. Configuração Vercel

Inspecionado anteriormente (`vercel project inspect ecopet-web`):

| Campo | Valor observado |
| ----- | --------------- |
| Project | `ecopet-web` |
| Root Directory | `apps/web` |
| Framework | Next.js |
| Output Directory | automático (Next default) |
| Node.js | 24.x |

Projeto acidental `ecopet_github`: não usar.  
Plano de URL estável: `docs/VERCEL_PREVIEW_STABLE_URL_PLAN.md` (**recomendado:** `homolog.eccopet.com`).

## 5. Variáveis e feature flags

Estado observado no Vercel (antes da configuração manual):

| Item | Preview |
| ---- | ------: |
| `DATABASE_URL` / `DIRECT_URL` | Escopo compartilhado com Production (bloqueante) |
| MP tokens TEST | Não comprovados (pull redigido) |
| Flags financeiras | Ausentes |
| `ALLOW_SIMULATED_PAYMENTS` | Ausente (adequado) |

Checklist manual: `docs/FASE_3_1_MANUAL_INFRASTRUCTURE_CHECKLIST.md`.  
Script de verificação (sem secrets): `scripts/check-preview-environment.mjs`.

## 6. Migrations

| Ação | Status |
| ---- | ------ |
| Migration Fase 3 no Git | Rastreada (`84d1b67`) |
| `migrate deploy` no DB Preview/homologação | **Não executado** |
| `migrate reset` | Não |
| Migration em Production nesta fase | Não |

## 7. Deploy Preview financeiro

**Não executado.**

## 8–12. Smoke / E2E / cobrança / webhook

**Não executados** nesta preparação (aguardam infraestrutura).

E2E local Fase 3 (sessão anterior, 16/16) **não** substitui Preview.

## 13–26. Domínios financeiros externos / CSV / logs

Não homologados externamente enquanto bloqueado.

### Incidentes / bloqueios

| ID | Severidade | Achado | Estado |
| -- | ---------- | ------ | ------ |
| B1 | Crítico | DB Preview/Production compartilhado ou não comprovado | **Aberto** |
| B2 | Crítico | MP TEST não comprovado | **Aberto** |
| B3 | Alto | Fase 3 não commitada | **Resolvido** (`84d1b67`) |
| B4 | Alto | Flags financeiras ausentes no Preview | **Aberto** (checklist) |
| B5 | Médio | Projeto `ecopet_github` acidental | Aberto (não usar) |
| B6 | Médio | Risco path `apps/web/apps/web` | Documentado |
| B7 | Médio | URL Preview estável não validada | **Aberto** (plano `homolog.eccopet.com`) |

## 27. Rollback

Procedimento: `docs/FASE_3_ROLLBACK.md`. Exercício Preview não executado (sem deploy).

## 28. Preparação de infraestrutura (esta atualização)

| Entrega | Path |
| ------- | ---- |
| Checklist manual | `docs/FASE_3_1_MANUAL_INFRASTRUCTURE_CHECKLIST.md` |
| Plano URL estável | `docs/VERCEL_PREVIEW_STABLE_URL_PLAN.md` |
| Script verificação | `scripts/check-preview-environment.mjs` |

Nenhuma operação externa (migrate / deploy / E2E / cobrança / webhook) executada.

## 29. Falhas restantes (infra)

1. Banco de homologação exclusivo não comprovado.  
2. Credenciais MP TEST no Preview não comprovadas.  
3. URL Preview estável não validada / DNS não configurado.  
4. Flags financeiras Preview não cadastradas.  
5. Deploy Preview financeiro e E2E externo pendentes.

## 30. Riscos financeiros

Inalterados: homologar sem isolamento pode escrever ledger no banco de Production; tokens MP compartilhados podem misturar sandbox e live.

## 31. Arquivos (preparação documental / infra)

- `docs/FASE_3_1_FINANCIAL_PREVIEW_RESULTADO.md` (este — estado Git corrigido)
- `docs/FASE_3_1_MANUAL_INFRASTRUCTURE_CHECKLIST.md`
- `docs/VERCEL_PREVIEW_STABLE_URL_PLAN.md`
- `scripts/check-preview-environment.mjs`
- `docs/FASE_3_1_ENVIRONMENT_ISOLATION.md` (referência de bloqueio)

## 32. Veredito

```text
FASE 3.1 BLOQUEADA
PRONTO PARA HOMOLOGAÇÃO FINANCEIRA
```

Motivo (inalterado):

```text
banco de homologação isolado ainda não comprovado;
credenciais Mercado Pago TEST ainda não comprovadas;
URL Preview estável ainda não validada.
```

Não avançar para `PRONTO PARA PILOTO FINANCEIRO CONTROLADO`.

### Desbloqueio mínimo (manual → depois automatizado)

1. Completar `docs/FASE_3_1_MANUAL_INFRASTRUCTURE_CHECKLIST.md`.  
2. Configurar DNS/`homolog.eccopet.com` conforme plano (manual).  
3. `node scripts/check-preview-environment.mjs` com exit 0 (+ fingerprint ≠ Production).  
4. Só então: `migrate deploy` no DB de homologação → deploy Preview → E2E.
