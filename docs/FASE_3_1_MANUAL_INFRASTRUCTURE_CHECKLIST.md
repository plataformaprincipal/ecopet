# Fase 3.1 — Checklist manual de infraestrutura (Preview)

**Branch:** `test/fase-3-1-financial-preview`  
**Projeto Vercel:** `ecopet-web` (não usar `ecopet_github`)  
**Produção:** `https://www.eccopet.com` — **não alterar**

Este checklist é para configuração **manual** pelo responsável.  
Não executar `migrate deploy`, deploy Preview financeiro, E2E externo, cobrança sandbox ou webhook até todos os itens críticos estarem marcados e validados com `scripts/check-preview-environment.mjs`.

---

## Banco Preview

```text
[ ] projeto Supabase/PostgreSQL exclusivo de homologação criado
[ ] DATABASE_URL Preview aponta para homologação
[ ] DIRECT_URL Preview aponta para homologação
[ ] valores Preview diferentes dos valores Production
[ ] banco Preview identificado como ambiente de homologação
[ ] nenhum dado real copiado sem anonimização
```

**Como comprovar (sem expor secrets):**

1. No Vercel → `ecopet-web` → Settings → Environment Variables: criar entradas **somente Preview** (não “Production + Preview”).
2. Pull sanitizado / script: fingerprints Preview ≠ Production.
3. Nome/projeto Supabase distinto (ex.: `eccopet-homolog`).

---

## Mercado Pago Preview

```text
[ ] MERCADO_PAGO_ACCESS_TOKEN de teste
[ ] NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY de teste
[ ] MERCADO_PAGO_WEBHOOK_SECRET de homologação
[ ] PAYMENT_PROVIDER=mercado_pago
[ ] ALLOW_SIMULATED_PAYMENTS=false
[ ] nenhuma credencial de produção no escopo Preview
```

**Como comprovar:** prefixo `TEST-` no access token e na public key (via script; nunca colar token completo em docs/tickets).

---

## Flags financeiras Preview

```text
[ ] FINANCIAL_LEDGER_ENABLED=true
[ ] PAYOUTS_ENABLED=true
[ ] MANUAL_PAYOUT_APPROVAL_REQUIRED=true
[ ] RESERVE_ENABLED=true
[ ] CHARGEBACKS_ENABLED=true
[ ] DAILY_RECONCILIATION_ENABLED=false
```

Escopo: **somente Preview**. Production permanece com recursos novos desativados até homologação.

---

## Vercel

```text
[ ] projeto correto: ecopet-web
[ ] Root Directory: apps/web
[ ] Framework: Next.js
[ ] Output Directory: automático
[ ] nenhuma configuração apps/web/apps/web
[ ] domínio ou URL estável de homologação definido
[ ] variáveis cadastradas somente no escopo Preview
```

Ver também: `docs/VERCEL_DEPLOYMENT_CONFIGURATION.md` e `docs/VERCEL_PREVIEW_STABLE_URL_PLAN.md`.

**Deploy CLI:** evitar `cd apps/web && vercel deploy` com Root Directory já = `apps/web` (path duplicado). Preferir deploy a partir da raiz do monorepo no projeto `ecopet-web`.

---

## URLs de aplicação (após domínio estável)

```text
[ ] APP_URL = URL estável de homologação (https)
[ ] NEXT_PUBLIC_APP_URL = mesma URL
[ ] NEXTAUTH_URL = mesma URL
[ ] WEB_URL = mesma URL
[ ] callbacks Auth/NextAuth atualizados para o host estável
[ ] webhook MP apontará para https://<host-estavel>/api/... (após deploy)
```

---

## Verificação automatizada (após preencher env local/pull Preview)

```bash
# Com arquivo Preview (gitignored), opcionalmente Production para comparar fingerprints:
node scripts/check-preview-environment.mjs path/to/.env.preview
# ou:
PREVIEW_ENV_FILE=apps/web/.env.preview.pull PRODUCTION_ENV_FILE=apps/web/.env.production.pull \
  node scripts/check-preview-environment.mjs
```

Exit code ≠ 0 = **bloqueio** (não migrar / não E2E).

---

## Após checklist completo (próxima fase — ainda não executar agora)

```text
[ ] npm run db:migrate:deploy  (somente DATABASE_URL de homologação)
[ ] deploy Preview no ecopet-web
[ ] smoke + E2E comercial/financeiro com WEB_URL estável
```

---

## Registro

| Item | Responsável | Data | Evidência (sem secrets) |
| ---- | ----------- | ---- | ----------------------- |
| Banco isolado | | | fingerprint / host sanitizado |
| MP TEST | | | prefixo TEST confirmado |
| Flags | | | nomes + true/false |
| URL estável | | | hostname apenas |
