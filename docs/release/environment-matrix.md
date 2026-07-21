# Environment Matrix

## Ambientes

| Ambiente | URL | Banco | Integrações | Status |
|----------|-----|-------|-------------|--------|
| local | `http://localhost:3000` / `:3002` test | Supabase via `.env` | misto sandbox/none | Em uso auditoria |
| test/harness | `:3002` + `ECOPET_STABLE_TEST_SERVER` | mesmo DB local | flags teste auth | APROVADO após fix |
| Preview Vercel | N/A | deve ser staging separado | sandbox | NÃO EXECUTADO |
| Production | `eccopet.com` (planejado) | Production isolado | Live | NÃO EXECUTADO |

## Variáveis (presença local — sem valores)

| Variável | Uso | Obrigatória Prod | Pública/Privada | Status local |
|----------|-----|------------------|-----------------|--------------|
| DATABASE_URL | Prisma runtime | Sim | Privada | SET |
| DIRECT_URL | Migrations | Sim | Privada | SET |
| AUTH_SECRET / NEXTAUTH_SECRET | Sessão | Sim | Privada | (não auditado valor) |
| NEXT_PUBLIC_APP_URL | URLs públicas | Sim | Pública | SET |
| NEXTAUTH_URL | Auth callbacks | Sim | Privada/URL | SET |
| RESEND_API_KEY | E-mail | Recomendada | Privada | SET |
| CLOUDINARY_* | Upload | Recomendada | Mista | SET (name/key) |
| TURNSTILE_* | Bot | Recomendada | Mista | SET |
| MERCADO_PAGO_ACCESS_TOKEN | Pagamentos | Se provider on | Privada | SET |
| PAYMENT_PROVIDER | Feature | Sim | Privada | SET(**none**) |
| MERCADO_PAGO_WEBHOOK_SECRET | Webhook | Se token set | Privada | (validação runtime) |
| TALKJS_SECRET_KEY | Chat | Se chat on | Privada | SET |
| TALKJS_APP_ID / NEXT_PUBLIC_TALKJS_APP_ID | Chat | Se chat on | Pública | **MISSING** |
| OPENAI_API_KEY | IA | Se AI on | Privada | SET |
| AI_ENABLED | Flag | — | Privada | SET(**false**) |
| BETTERSTACK / LOGTAIL token | Obs | Recomendada | Privada | **MISSING** |
| NEXT_PUBLIC_FIREBASE_* | Push | Se push on | Pública | **MISSING** |
| NEXT_PUBLIC_GA_* / GTM | Analytics | Opcional | Pública | SET |
| NEXT_PUBLIC_GOOGLE_MAPS_API_KEY | Maps | Opcional | Pública | SET |

Templates: `.env.example`, `.env.vercel.preview.example`, `.env.vercel.production.example`.  
Validação: `apps/web/src/lib/validate-production-env.ts` + `npm run validate:env`.
