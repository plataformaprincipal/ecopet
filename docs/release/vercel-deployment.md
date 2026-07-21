# Vercel Deployment — EcoPet

## Estado nesta auditoria

| Item | Status |
|------|--------|
| `apps/web/vercel.json` | Criado (install `npm ci` na raiz, build monorepo, region `gru1`) |
| CLI autenticada | **NÃO** — `vercel whoami` iniciou device login; fluxo cancelado (sem credenciais) |
| Deploy Preview | NÃO EXECUTADO |
| Deploy Production | NÃO EXECUTADO |

## Configuração do projeto

| Setting | Valor |
|---------|--------|
| Root Directory | `apps/web` |
| Framework | Next.js |
| Install | `cd ../.. && npm ci` (também em `vercel.json`) |
| Build | `cd ../.. && npm run build` |
| Node | >=20 (`engines`) |
| Região sugerida | `gru1` (São Paulo) |

## Passos manuais (obrigatórios)

```bash
npm i -g vercel
vercel login
cd apps/web
vercel link
# Importar variáveis Preview a partir de .env.vercel.preview.example
vercel env pull   # opcional, cuidado com secrets
vercel            # Preview
# Após smoke OK:
vercel --prod
```

Dashboard alternativo: conectar GitHub → Root `apps/web` → importar env Production/Preview.

## Domínios

- Production canônica (template): `https://eccopet.com`
- Fallback docs: `https://ecopet-web.vercel.app`

## Webhooks pós-deploy

| Integração | URL |
|------------|-----|
| Mercado Pago | `https://<domínio>/api/webhooks/mercado-pago` |
| TalkJS | `https://<domínio>/api/webhooks/talkjs` |

## Proibido

- Usar `DATABASE_URL` de Production em Preview
- Ativar `PAYMENT_PROVIDER=mercado_pago` Live sem smoke sandbox
- `ECOPET_STABLE_TEST_SERVER=1` na Vercel
