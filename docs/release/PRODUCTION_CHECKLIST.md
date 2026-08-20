# Production checklist (não executar nesta missão)

Nada abaixo foi aplicado em Production nesta execução.

## Backup / restore

- Mecanismo: backups automáticos Supabase (plano) + `npm run db:backup:local` em dev.
- Restore destrutivo **não** foi executado.
- Pendência: comprovante de restore em homologação (`docs/production/backups.md`).

## DATABASE_URL Production

- Separar pooler (`DATABASE_URL`) e `DIRECT_URL` (migrations).
- Não reutilizar a URL de homologação.
- Não migrar Production nesta missão.

## Resend

- Confirmar `RESEND_API_KEY` + `EMAIL_FROM` no ambiente Production (não nesta execução).
- SMTP Gmail residual não é canal Production.

## Migrations Production pendentes (listar, não aplicar)

A branch `feat/pricing-foundation` contém, entre outras, migrations posteriores ao ledger:

- `20260819180000_pricing_foundation` — catálogo PricingVersion / SKUs / regras
- `20260819220000_partner_mp_connection` — OAuth cifado do vendedor

**Production ainda precisará, após freeze:**

1. Backup.
2. `prisma migrate deploy` com `DIRECT_URL` de Production.
3. Seed de pricing: `seed-pricing.ts` → versão `BR-2026.08-v1` ACTIVE, 204 SKUs.
4. Validar: `node scripts/validate-pricing-web.mjs` contra Production **somente** depois do deploy consciente.

Não executar os passos 2–4 agora.

## Secrets

Não rotacionar/alterar secrets Production nesta execução.
