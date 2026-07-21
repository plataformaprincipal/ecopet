# Integrações — status técnico

| Integração | Código | Credencial prod | Veredito |
|---|---|---|---|
| Mercado Pago | Implementado + HMAC | Sandbox típico | Homologação com sandbox; Live bloqueado até secret+token prod |
| TalkJS | Implementado + HMAC webhook | Test Mode | Live bloqueado |
| OpenAI | Gateway + flags | Depende do env | Homologação |
| Better Stack | Logger + admin test | Depende do env | Homologação — validar Live tail |
| Firebase FCM | Dispatcher | Depende | Homologação |
| Cloudinary | Validação MIME/size | Depende | Homologação |
| Resend | email-service | Depende | Homologação |
| Maps / GA / GTM / Turnstile | Config + flags | Depende | Homologação |

Kill-switches: `AI_ENABLED`, `MSG_FLAG_*`, `OBS_FLAG_*`, `FIREBASE_MESSAGING_ENABLED`, `TURNSTILE_ENABLED`, `MERCADO_PAGO_ENVIRONMENT`.
