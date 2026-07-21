# Integrações — OpenAI / TalkJS / MP / Firebase / Cloudinary / Resend / Prisma

Telemetria central: `integrations.ts` + hooks nos serviços.

| Provider | O que registra | O que NÃO registra |
|---|---|---|
| OpenAI | modelo, api, tokens, duração, erro | prompts/respostas/API key |
| TalkJS | webhooks, outcome | mensagens, secret |
| Mercado Pago | webhooks, assinatura inválida | payload, tokens, cartão |
| Firebase | push sent/failed | token FCM completo |
| Cloudinary | upload ok/fail, duração | secret, arquivo |
| Resend | sent/failed, latency | API key, corpo, e-mail completo |
| Prisma | helper `observePrismaOperation` | SQL/params |

Maps: interface via `observeIntegrationCall("google_maps", ...)`.
