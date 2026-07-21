# Integrações — aceitação

| Integração | Sandbox/Test | Live/Prod | Evidência automatizada | Status |
|---|---|---|---|---|
| Supabase/Prisma | Local DB | — | register/pets | Local |
| OpenAI | Se key | — | unit AI | Bloqueado se AI_ENABLED=false |
| TalkJS | Test Mode | Não | foundation/talkjs unit | Bloqueado Live |
| Better Stack | Se token | — | observability unit + admin test | Homolog |
| Mercado Pago | Preferir test | Não sem auth | mercado-pago unit | Bloqueado Live |
| Firebase | Se config | — | firebase unit | Parcial (web config) |
| Cloudinary | Se config | — | test:cloudinary | Homolog |
| Resend | Se key | — | test:email | Homolog |
| Maps/GA/GTM/Turnstile | Flags | — | unit | Homolog |
