# Fase 3.1 — Isolamento de ambientes (Preview vs Production)

**Data:** 2026-08-06 (revalidação)  
**Branch:** `test/fase-3-1-financial-preview`  
**HEAD:** `b3b8d9a` (prep infra) · Fase 3 `84d1b67` · tsbuildinfo `0c6a97b`  
**Working tree (início da revalidação):** limpo  
**Bloqueio vigente:** exclusivamente infraestrutura (DB isolado / MP TEST / URL estável / flags)  
**Projeto Vercel:** `ecopet-s-projects/ecopet-web`  
**Método:** `vercel env ls` + `vercel env pull --environment=preview` + `vercel project inspect` + `vercel domains/alias ls` + `scripts/check-preview-environment.mjs`  
**Regra:** isolamento só é aceito com evidência de valores diferentes — não só presença do nome da variável.  
**Checklist manual:** `docs/FASE_3_1_MANUAL_INFRASTRUCTURE_CHECKLIST.md`

---

## Veredito de isolamento

```text
ISOLAMENTO NÃO COMPROVADO — TRATAR COMO FALHA BLOQUEANTE
```

Motivos (revalidação 2026-08-06):

1. `DATABASE_URL` e `DIRECT_URL` permanecem no **mesmo registro** com escopo `Production, Preview` (`vercel env ls`). Indica valor compartilhado até existirem entradas **somente Preview** distintas.
2. `vercel env pull` Preview (CLI 58.7.1) devolve sensíveis como `[SENSITIVE]` (len=11) — **impossível** fingerprint/host Preview ≠ Production pelo pull.
3. Tokens MP / webhook / `PAYMENT_PROVIDER` / URLs públicas também redigidos no pull — **impossível** provar prefixo `TEST-` nem host de homologação.
4. Flags financeiras (`FINANCIAL_LEDGER_ENABLED`, `PAYOUTS_ENABLED`, `MANUAL_PAYOUT_APPROVAL_REQUIRED`, `RESERVE_ENABLED`, `CHARGEBACKS_ENABLED`, `DAILY_RECONCILIATION_ENABLED`) **ausentes** no Preview (`env ls` + arquivo pull).
5. `ALLOW_SIMULATED_PAYMENTS` **ausente** no Preview (adequado; não ligado no Vercel).
6. Domínio estável `homolog.eccopet.com` **não** aparece em `vercel domains ls` / `vercel alias ls` (aliases observados: `eccopet.com`, `www.eccopet.com`, `*.vercel.app`).

Consequência obrigatória:

- **Não** executar `migrate deploy` no banco apontado pelo Preview.
- **Não** executar deploy Preview financeiro / E2E externo / cobrança sandbox / webhook nesta rodada.
- Encerrar com **FASE 3.1 BLOQUEADA**.

---

## Evidência sanitizada — `check-preview-environment.mjs`

```text
Fonte: apps/web/.env.preview.pull
RESULTADO: BLOQUEADO
exit code: 2
```

Checklist (arquivo pull somente; sem secrets):

```text
[x] pull Preview gerado (gitignored)
[ ] DATABASE_URL presente com valor legível — REDACTED [SENSITIVE]
[ ] DIRECT_URL presente com valor legível — REDACTED [SENSITIVE]
[ ] banco identificado como homologação — não comprovado
[ ] banco Preview diferente de Production — não comprovado (escopo compartilhado + pull redigido)
[ ] Mercado Pago TEST confirmado — REDACTED [SENSITIVE]
[x] ALLOW_SIMULATED_PAYMENTS=false ou ausente no Preview — AUSENTE (ok)
[ ] flags financeiras válidas — AUSENTES no Vercel Preview
[ ] URL pública sem localhost — REDACTED [SENSITIVE]
[ ] URL de homologação estável — homolog.eccopet.com NÃO configurado
```

Nota: na primeira execução o script misturou `process.env` local (falso positivo `ALLOW_SIMULATED_PAYMENTS=true` / `FINANCIAL_LEDGER_ENABLED`). Análise do arquivo e `vercel env ls` confirmam ausência dessas flags no Preview. O script foi ajustado para, quando um arquivo é informado, usar **somente** o arquivo.

---

## Evidência sanitizada — Vercel

| Campo | Valor |
| ----- | ----- |
| Project | `ecopet-web` (`prj_s0bPVSphC7jzVfodZswqxQ3nyL4u`) |
| Root Directory | `apps/web` |
| Framework | Next.js |
| Output Directory | Next.js default (não `public`) |
| Node.js | 24.x |
| Production URL | `https://www.eccopet.com` (**não alterada**) |
| Domínio homolog | **ausente** (`homolog.eccopet.com` não listado) |
| Projeto acidental | `ecopet_github` existe — **não usar** |

Escopos críticos (`vercel env ls`):

| Variável | Ambientes |
| -------- | --------- |
| `DATABASE_URL` | Production, Preview |
| `DIRECT_URL` | Production, Preview |
| `MERCADO_PAGO_ACCESS_TOKEN` | Production, Preview |
| `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY` | Production, Preview |
| `MERCADO_PAGO_WEBHOOK_SECRET` | Preview, Production |
| `APP_URL` / `NEXT_PUBLIC_APP_URL` / `NEXTAUTH_URL` / `WEB_URL` | Preview, Production |
| Flags financeiras | **não cadastradas** |

---

## Tabela de isolamento

| Recurso | Preview | Production | Separado | Evidência |
| ------- | ------- | ---------- | -------: | --------- |
| PostgreSQL (`DATABASE_URL`) | Escopo compartilhado | Mesmo registro | **Não** | `env ls` |
| PostgreSQL (`DIRECT_URL`) | Escopo compartilhado | Mesmo registro | **Não** | `env ls` |
| MP Access Token | Compartilhado | Compartilhado | **Não comprovado** | Pull redigido |
| MP Public Key | Compartilhado | Compartilhado | **Não comprovado** | Pull redigido |
| MP Webhook Secret | Compartilhado | Compartilhado | **Não comprovado** | Pull redigido |
| `ALLOW_SIMULATED_PAYMENTS` | Ausente | Ausente | OK | Adequado |
| Flags ledger/payout/reserve | Ausentes | Ausentes | n/a | Bloqueante para homologação financeira |
| URL estável homolog | Ausente | n/a | n/a | Sem `homolog.eccopet.com` |
| Contagens DB Preview ≠ Prod | Não medidas | — | **Não** | Risco de DB compartilhado |

---

## Contagens / amostras

| Métrica | Resultado |
| ------- | --------- |
| Host DATABASE Preview | Indisponível (pull redigido) |
| Host DATABASE Production | Não puxado nesta rodada (desnecessário para bloqueio; escopo já compartilhado) |
| Fingerprint Preview | Indisponível |
| `homolog.eccopet.com` | Não configurado |
| check-preview exit | **2** |

---

## Ações necessárias para desbloquear

1. Completar `docs/FASE_3_1_MANUAL_INFRASTRUCTURE_CHECKLIST.md`.
2. Criar Postgres/Supabase **exclusivo** de homologação.
3. No Vercel `ecopet-web`: `DATABASE_URL` / `DIRECT_URL` **somente Preview**, valores ≠ Production (remover vínculo do mesmo registro).
4. Credenciais MP **TEST** só no Preview; Production intocada.
5. Cadastrar flags financeiras só no Preview.
6. Configurar DNS/`homolog.eccopet.com` (plano em `docs/VERCEL_PREVIEW_STABLE_URL_PLAN.md`).
7. Fornecer arquivo Preview **não redigido** localmente (painel/export seguro) e rodar:
   `node scripts/check-preview-environment.mjs <arquivo>` → **exit 0**, com `PRODUCTION_ENV_FILE` para fingerprints distintos.
8. Só então: `migrate deploy` no DB de homologação → deploy Preview → E2E.

---

## Arquivos locais de pull

- `apps/web/.env.preview.pull` — gitignored; valores sensíveis `[SENSITIVE]`.
- Não versionar. Remover após análise se desejado.
