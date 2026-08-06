# Configuração de Deploy Vercel — EccoPet

**Atualizado:** Fase 2.2 (2026-08-06)  
**Projeto Vercel:** `ecopet-web` (team `ecopet-s-projects`)  
**Produção atual:** `https://www.eccopet.com` (não alterar nesta fase)

## Opções avaliadas

| Opção | Root Directory | Install | Build | Resultado |
| ----- | -------------- | ------- | ----- | --------- |
| A | `.` (repo root) | `npm ci` | `npm run build` | Viável se o projeto Vercel apontar para a raiz |
| B | `apps/web` | `cd ../.. && npm ci` | `cd ../.. && npm run build` | **Preferida** — já documentada em `apps/web/vercel.json` |

## Configuração oficial (Opção B)

| Campo | Valor |
| ----- | ----- |
| Framework Preset | Next.js |
| Root Directory | `apps/web` |
| Install Command | `cd ../.. && npm ci` |
| Build Command | `cd ../.. && npm run build` |
| Output Directory | automático (Next) |
| Node.js | ≥ 20 (projeto usa 24.x) |
| Region | `gru1` (vercel.json) |

Arquivo: `apps/web/vercel.json`

```json
{
  "framework": "nextjs",
  "installCommand": "cd ../.. && npm ci",
  "buildCommand": "cd ../.. && npm run build",
  "regions": ["gru1"]
}
```

### Motivo

- Monorepo npm workspaces: Prisma (`@ecopet/database`) e scripts de build vivem na raiz.
- `npm run build` na raiz executa `scripts/build-web.mjs` com heap elevado.
- Root em `apps/web` mantém o framework Next detectado corretamente.

### Prisma

- `db:generate` deve ocorrer no build (via workspace) — **não** rodar `migrate deploy` em cada cold start.
- Migrations de homologação: comando explícito local/CI com `DATABASE_URL` de homologação.

### URL pública em Preview

`resolvePublicAppUrl()` (`apps/web/src/lib/app-url.ts`) prioriza URLs não-localhost quando `VERCEL=1`, incluindo `VERCEL_URL`.

Para cookies/sessão estáveis, definir também em Preview (quando o domínio Preview for conhecido):

- `APP_URL` / `NEXT_PUBLIC_APP_URL` / `NEXTAUTH_URL` / `WEB_URL` → `https://<deployment>.vercel.app`

Se o hostname mudar a cada deploy, preferir alinhar após o primeiro deploy Preview ou usar domínio Preview estável do branch.

## Regras

- **Não** deploy Production nesta fase.
- `ALLOW_SIMULATED_PAYMENTS` ausente ou `false` em Preview.
- Secrets MP **sem** prefixo `NEXT_PUBLIC_`.
