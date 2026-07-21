# Importação em massa de variáveis — Vercel

Arquivos modelo (sem secrets reais):

| Arquivo | Ambiente Vercel |
|---|---|
| [`.env.vercel.preview.example`](../../.env.vercel.preview.example) | Preview |
| [`.env.vercel.production.example`](../../.env.vercel.production.example) | Production |

Os arquivos reais `.env` / `apps/web/.env` / `packages/database/.env` **não** devem ir para o GitHub (já cobertos por `.gitignore`).

---

## Checklist de importação (exato)

### Preparação

1. Abra o `.env` local na raiz e tenha as chaves à mão (não cole secrets no chat/PR).
2. Copie `.env.vercel.preview.example` → arquivo temporário local (ex.: `.env.vercel.preview.fill`) **fora do git** ou em pasta ignorada.
3. Copie `.env.vercel.production.example` → `.env.vercel.production.fill` (local).
4. Substitua **todos** os `<PLACEHOLDER_*>` pelos valores reais.
5. Confirme que **nenhum** secret usa prefixo `NEXT_PUBLIC_`.
6. Confirme `UPLOAD_DEV_FALLBACK=0` nos dois arquivos preenchidos.
7. Confirme URLs:
   - Preview: URL do deployment Preview (não localhost)
   - Production: `https://eccopet.com` em `NEXTAUTH_URL`, `APP_URL`, `NEXT_PUBLIC_APP_URL`
8. Confirme `BETTER_STACK_ENVIRONMENT=preview` / `production` conforme o arquivo.
9. TalkJS: local está em **Test Mode** (`TALKJS_ENVIRONMENT=test`) — mantenha `test` até App Live.
10. Mercado Pago: Preview = `test` + tokens TEST; Production = `production` + tokens LIVE + `MERCADO_PAGO_WEBHOOK_SECRET`.

### No painel Vercel

1. Project → **Settings** → **Environment Variables**.
2. Use **Import .env** / bulk paste (ou CLI abaixo).
3. Importe o arquivo Preview marcando **somente Preview**.
4. Importe o arquivo Production marcando **somente Production**.
5. Variáveis `NEXT_PUBLIC_*` precisam de **redeploy** após alteração.
6. Rode migrations com `DIRECT_URL`: `npm run db:migrate:deploy` (CI ou máquina segura).
7. Redeploy Production e Preview.
8. Smoke: `/api/health/live`, `/api/health/ready`, login, Admin Observability (evento teste).

### CLI (alternativa)

```bash
# Após preencher os arquivos LOCALMENTE (não commitados):
npx vercel env add   # interativo, uma a uma — ou
# Dashboard Import é o caminho mais rápido para massa

# Pull (nunca commit):
npx vercel env pull .env.vercel.pull.local --environment=production
```

Não execute deploy neste documento — apenas configure variáveis.

### Proibido em Production/Preview

| Flag | Motivo |
|---|---|
| `FORCE_INSECURE_SESSION_COOKIE=1` | Cookie inseguro |
| `AUTH_RATE_LIMIT_DISABLED=1` | Brute force |
| `AUTH_TEST_EXPOSE_OTP=1` | OTP em JSON |
| `ALLOW_TEST_RESEND=1` | Rotas de teste |
| `TURNSTILE_DEV_BYPASS=1` | Bypass anti-bot |
| `UPLOAD_DEV_FALLBACK=1` | Upload local inseguro |
| `NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN` | Token no browser |
| `NEXT_PUBLIC_TALKJS_SECRET_KEY` | Secret no browser |
| `NEXT_PUBLIC_OPENAI_API_KEY` | Secret no browser |

---

## Auditoria (resumo)

### Arquivos encontrados

| Arquivo | Status |
|---|---|
| `.env` (raiz) | Presente localmente (66 keys) — **gitignored** |
| `.env.local` | Ausente |
| `.env.example` | Presente (template) |
| `apps/web/.env` | Presente (40 keys) — sync parcial |
| `apps/web/.env.local` | Ausente |
| `apps/web/.env.example` | Presente |
| `packages/database/.env` | Presente (DATABASE_URL, DIRECT_URL) |
| `packages/database/.env.example` | Ausente |

### Modos atuais (valores não secretos do `.env` raiz)

| Integração | Valor observado | Ação |
|---|---|---|
| TalkJS | `TALKJS_ENVIRONMENT=test` | Manter Test Mode até Live |
| Mercado Pago | `MERCADO_PAGO_ENVIRONMENT=production` + `PAYMENT_PROVIDER=none` | Homologar com test no Preview; Live só com token Live |
| Better Stack | `BETTER_STACK_ENVIRONMENT=development` | Preview=`preview`, Production=`production` |
| URLs locais | `localhost:3000` | **Não** copiar para Vercel |
| AI | `AI_ENABLED=false` | Ligar em produção quando pronto |

### Secrets — presença (sem valores)

Presentes no `.env` raiz: DATABASE_URL, DIRECT_URL, AUTH_SECRET, OpenAI, TalkJS secret, MP token+webhook+public, Resend, Cloudinary secret, Better Stack token+host, Turnstile site+secret, Firebase private key + VAPID, GA, GTM, Maps browser key.

### Ausentes / incompletos no `.env` raiz

| Variável / grupo | Impacto |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` (+ authDomain, projectId, appId, senderId, bucket) | FCM client incompleto |
| `TALKJS_WEBHOOK_SECRET` | Webhook TalkJS frágil em prod |
| `TURNSTILE_ENABLED` | Default do código costuma ativar se keys existem |
| Firebase web config completa | Preencher no template Vercel |

### Duplicadas / aliases

| Par | Nota |
|---|---|
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | Usar o **mesmo** valor |
| `MERCADO_PAGO_ACCESS_TOKEN` / `MERCADOPAGO_ACCESS_TOKEN` | Preferir `MERCADO_PAGO_*` |
| `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY` / `MERCADO_PAGO_PUBLIC_KEY` | Preferir `NEXT_PUBLIC_*` no client |
| `BETTER_STACK_SOURCE_TOKEN` / `LOGTAIL_SOURCE_TOKEN` | Preferir Better Stack; Logtail é legado |
| `apps/web/.env` vs raiz `.env` | Duplicação parcial — fonte de verdade para Vercel = arquivos `.env.vercel.*.example` preenchidos |

### Não usadas / não importar na Vercel (web)

| Variável | Motivo |
|---|---|
| `NODE_ENV` | Definida pela Vercel |
| `NODE_OPTIONS` | Build local |
| `API_PORT`, `JWT_*`, `WEB_URL`, `API_INTERNAL_URL` | Pacote `apps/api` / local |
| `TEST_EMAIL` | Dev only |
| `UPLOAD_DEV_FALLBACK=1` | Proibido em deploy |
| `SENTRY_DSN` | Deprecado / stub |
| SMTP completo se `EMAIL_PROVIDER=resend` | Opcional |

### Segurança NEXT_PUBLIC_

| Check | Resultado |
|---|---|
| Better Stack token sem `NEXT_PUBLIC_` | OK |
| OpenAI / Resend / Cloudinary secret / DB / TalkJS secret / MP access / Firebase private | OK (servidor) |
| VAPID / TalkJS App ID / MP public key / Turnstile site / Firebase web / GA / GTM / Maps | Públicos legítimos |

---

## Tabela final

| Variável | Integração | Preview | Production | Pública/Secreta | Status | Ação |
|---|---|---|---|---|---|---|
| NEXTAUTH_URL | Auth | URL Preview | https://eccopet.com | Pública (URL) | Modelo pronto | Preencher / importar |
| APP_URL | Auth | URL Preview | https://eccopet.com | Pública (URL) | Modelo pronto | Preencher |
| NEXT_PUBLIC_APP_URL | Auth | URL Preview | https://eccopet.com | Pública | Modelo pronto | Preencher |
| AUTH_SECRET | Auth | Sim | Sim | Segredo | Presente local | Copiar valor forte |
| NEXTAUTH_SECRET | Auth | Sim | Sim | Segredo | Presente local | Igual AUTH_SECRET |
| DATABASE_URL | Prisma/Supabase | Staging | Prod | Segredo | Presente local | Separar por ambiente |
| DIRECT_URL | Migrations | Staging | Prod | Segredo | Presente local | Separar |
| RESEND_API_KEY | Resend | Sim | Sim | Segredo | Presente | Importar |
| EMAIL_FROM | Resend | Sim | Sim | Servidor | Presente | Domínio verificado em prod |
| CLOUDINARY_* | Cloudinary | Sim | Sim | Secret=API_SECRET | Presente | Importar |
| TURNSTILE_* | Turnstile | Sim | Sim | Site pública / secret | Presente | Importar + ENABLED |
| NEXT_PUBLIC_TALKJS_APP_ID | TalkJS | Test | Test→Live | Pública | Presente | Manter test |
| TALKJS_SECRET_KEY | TalkJS | Test | Test→Live | Segredo | Presente | Servidor only |
| TALKJS_ENVIRONMENT | TalkJS | test | test* | Servidor | Local=test | *live só com App Live |
| TALKJS_WEBHOOK_SECRET | TalkJS | Opcional | Recomendado | Segredo | Ausente local | Criar no painel TalkJS |
| MERCADO_PAGO_* | MP | test | production | Token=secret | Presente | Preview=TEST; Prod=LIVE |
| PAYMENT_PROVIDER | MP | mercado_pago | mercado_pago | Servidor | Local=none | Ativar quando pronto |
| OPENAI_API_KEY | OpenAI | Opcional | Sim | Segredo | Presente | Servidor only |
| AI_ENABLED | OpenAI | false | true | Servidor | Local=false | Decisão de negócio |
| BETTER_STACK_* | Observability | preview | production | Token=secret | Presente | Env tag correta |
| FIREBASE_PRIVATE_KEY | FCM | Sim | Sim | Segredo | Presente | Servidor only |
| NEXT_PUBLIC_FIREBASE_* | FCM | Sim | Sim | Pública | **Ausente** (exceto VAPID) | Preencher config web |
| NEXT_PUBLIC_FIREBASE_VAPID_KEY | FCM | Sim | Sim | Pública | Presente | OK |
| NEXT_PUBLIC_GA_MEASUREMENT_ID | GA4 | Sim | Sim | Pública | Presente | Consent Mode |
| NEXT_PUBLIC_GTM_ID | GTM | Sim | Sim | Pública | Presente | Evitar duplicar GA |
| NEXT_PUBLIC_GOOGLE_MAPS_API_KEY | Maps | Sim | Sim | Pública | Presente | Restringir domínio |
| UPLOAD_DEV_FALLBACK | Upload | 0 | 0 | Servidor | Local=1 | **Forçar 0** na Vercel |
| SENTRY_DSN | — | Não | Não | — | Ausente | Não importar |
| LOGTAIL_SOURCE_TOKEN | Legado | Não | Não | — | Ausente | Usar BETTER_STACK_* |

\* Production template mantém `TALKJS_ENVIRONMENT=test` até decisão explícita de Live.

---

## Validação pós-import

```bash
npm run validate:env
npm run lint
npm run type-check
npm run build
```

Health: `GET /api/health/live` e `/api/health/ready` no domínio Preview/Production.
