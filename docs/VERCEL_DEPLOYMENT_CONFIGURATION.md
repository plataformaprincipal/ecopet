# Configuração de Deploy Vercel — EccoPet

**Atualizado:** Fase 3.1 (2026-08-06)  
**Projeto Vercel canônico:** `ecopet-web` (team `ecopet-s-projects`, `prj_s0bPVSphC7jzVfodZswqxQ3nyL4u`)  
**Produção atual:** `https://www.eccopet.com` (não alterar nesta fase)  
**Não usar:** projeto acidental `ecopet_github`

## Configuração efetivamente inspecionada (Fase 3.1)

Comando: `vercel project inspect ecopet-web` (link em `apps/web/.vercel`).

| Campo | Valor observado |
| ----- | --------------- |
| Root Directory | `apps/web` |
| Framework Preset | Next.js |
| Output Directory | Next.js default (**não** `public`) |
| Node.js Version | 24.x |
| Install / Build (painel) | Defaults do inspect; preferir overrides de `apps/web/vercel.json` |
| Region (vercel.json) | `gru1` |

### Como deployar Preview sem path duplicado

Root Directory do projeto já é `apps/web`. Portanto:

- Deploy CLI a partir da **raiz do monorepo** com projeto `ecopet-web`, **ou**
- Ajustar Root Directory para `.` se o cwd/link for `apps/web`.

Evitar: `cd apps/web && vercel deploy` enquanto Root Directory = `apps/web` → erro histórico `apps/web/apps/web`.

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
