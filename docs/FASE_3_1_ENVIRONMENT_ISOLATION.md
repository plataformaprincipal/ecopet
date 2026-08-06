# Fase 3.1 — Isolamento de ambientes (Preview vs Production)

**Data:** 2026-08-06  
**Branch:** `test/fase-3-1-financial-preview`  
**Projeto Vercel inspecionado:** `ecopet-s-projects/ecopet-web`  
**Método:** `vercel env ls` + `vercel env pull` (Preview e Production) + metadados sem secrets  
**Regra:** isolamento só é aceito com evidência de valores diferentes — não só presença do nome da variável.

---

## Veredito de isolamento

```text
ISOLAMENTO NÃO COMPROVADO — TRATAR COMO FALHA BLOQUEANTE
```

Motivos:

1. `DATABASE_URL` e `DIRECT_URL` estão definidos para **Preview e Production no mesmo registro** (`vercel env ls` → escopo `Production, Preview`, idade ~33d). Em Vercel isso indica **um único valor compartilhado** entre ambientes, salvo entradas separadas por ambiente (não observadas).
2. `vercel env pull` (CLI 58.7.1) devolveu valores sensíveis como placeholder `[SENSITIVE]` (len=11) — **impossível** extrair host/project-ref/database name reais para comparar Preview ≠ Production.
3. Tokens MP no pull também vieram redigidos — **impossível** provar prefixo `TEST-` / ambiente sandbox só pelo conteúdo baixado.
4. Flags financeiras (`FINANCIAL_LEDGER_ENABLED`, etc.) **ausentes** no Preview.
5. `APP_URL` / `WEB_URL` / `NEXTAUTH_URL` também no escopo compartilhado Preview+Production (risco de cookies/host errado).

Consequência obrigatória da especificação Fase 3.1:

- **Não** executar `migrate deploy` no banco apontado pelo Preview.
- **Não** executar E2E financeiro externo neste estado.
- Encerrar fase com **FASE 3.1 BLOQUEADA**.

---

## Tabela de isolamento

| Recurso | Preview | Production | Separado | Evidência |
| ------- | ------- | ---------- | -------: | --------- |
| Supabase/PostgreSQL (`DATABASE_URL`) | Presente (escopo compartilhado) | Presente (mesmo registro) | **Não comprovado** | `vercel env ls`: `Production, Preview`; pull redigido `[SENSITIVE]` |
| Supabase/PostgreSQL (`DIRECT_URL`) | Presente (escopo compartilhado) | Presente (mesmo registro) | **Não comprovado** | Idem |
| Mercado Pago Access Token | Presente (compartilhado) | Presente (compartilhado) | **Não comprovado** | Pull redigido; `mpIsTest` não verificável |
| Mercado Pago Public Key | Presente (compartilhado) | Presente (compartilhado) | **Não comprovado** | Pull redigido |
| Mercado Pago Webhook Secret | Presente | Presente | **Não comprovado** | Mesmo escopo / pull redigido |
| `MERCADO_PAGO_ENVIRONMENT` | Presente | Presente | **Não comprovado** | Valor redigido no pull |
| `PAYMENT_PROVIDER` | Presente | Presente | **Não comprovado** | Valor redigido no pull |
| `ALLOW_SIMULATED_PAYMENTS` | **Ausente** | **Ausente** | OK (ausência) | Adequado (não ligado) |
| Autenticação (`AUTH_SECRET` / `NEXTAUTH_*`) | Presente (compartilhado) | Presente | **Não comprovado** | Escopo `Preview, Production` |
| Cloudinary | Presente (compartilhado) | Presente | **Não comprovado** | Escopo compartilhado |
| Resend | Presente (compartilhado) | Presente | **Não comprovado** | Escopo compartilhado |
| Webhook URL | Não configurada nesta fase | n/a | n/a | Sem Preview URL utilizável nesta rodada |
| Usuários / Produtos / Pedidos | Contagem Preview ≠ Prod **não medida** | — | **Não comprovado** | Sem conexão segura a DB separado |
| Ledger | Flags ausentes no Preview | — | n/a | Não homologado externamente |

---

## Contagens / amostras

| Métrica | Resultado |
| ------- | --------- |
| Host DATABASE Preview | **Indisponível** (pull redigido) |
| Host DATABASE Production | **Indisponível** (pull redigido) |
| Project reference Supabase | **Indisponível** |
| Nº usuários/pedidos Preview vs Prod | **Não executado** (risco de DB compartilhado) |

---

## Ações necessárias para desbloquear

1. Criar **projeto Supabase (ou Postgres) exclusivo de homologação**.
2. No Vercel `ecopet-web`, criar `DATABASE_URL` / `DIRECT_URL` **somente Preview** com valores distintos (remover o vínculo Production+Preview do mesmo valor).
3. Garantir credenciais MP **TEST** só no Preview; Production permanece intocada nesta fase.
4. Definir flags financeiras Preview conforme especificação.
5. Reexecutar este documento com fingerprints de host **diferentes** (sem imprimir secrets).
6. Só então: `migrate deploy` no DB de homologação + deploy Preview + E2E.

---

## Arquivos locais de pull

- `apps/web/.env.preview.pull` / `.env.production.pull` — gitignored (`apps/web/.gitignore` → `.env*`).
- Não versionar. Remover após análise se desejado.
