# Integration inventory — launch

Fonte de verdade: código em `apps/web`. Status `WORKING` só com env + backend + evidência de provider. Sem isso: MISSING_ENV / EXTERNAL_BLOCKER / CONFIGURED_NOT_VERIFIED.

| Provider | Capability | Launch class | Frontend | Backend | Database | Env | Live test | Status |
|----------|------------|--------------|----------|---------|----------|-----|-----------|--------|
| Google Auth | OIDC login | LAUNCH_REQUIRED | sim | sim | ExternalAuthAccount | GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET | E2E interno; smoke real pendente Cloud | EXTERNAL_CONFIG_REQUIRED |
| Facebook Auth | login | REMOVED | não | não | — | — | — | REMOVED |
| Apple Auth | login | REMOVED | não | não | — | — | — | REMOVED |
| OpenAI | EccoPet AI | LAUNCH_REQUIRED | sim | sim | AI logs existentes | OPENAI_API_KEY | admin test / suites AI | CONFIGURED_NOT_VERIFIED até smoke |
| Resend | e-mail transacional | LAUNCH_REQUIRED | telas reset | sim | tokens reset | RESEND_API_KEY, EMAIL_FROM | admin test | CONFIGURED_NOT_VERIFIED até send real |
| Twilio | SMS OTP recuperação | LAUNCH_OPTIONAL | recuperação | sim | phone | TWILIO_* + SMS_PROVIDER=twilio | admin test | OPTIONAL / MISSING_ENV |
| TalkJS | mensagens sociais | LAUNCH_REQUIRED | inbox / Mensagem | sim | Conversation | NEXT_PUBLIC_TALKJS_APP_ID, TALKJS_SECRET_KEY | admin test | MISSING_ENV ou CONFIGURED_NOT_VERIFIED |
| Mercado Pago | checkout 1:1 | LAUNCH_REQUIRED | checkout | sim | Payment/Order | MERCADO_PAGO_ACCESS_TOKEN | test:mercado-pago | READY_PAYMENT |
| Mercado Pago Split | marketplace split | LAUNCH_REQUIRED | partner OAuth | PartnerMpConnection | PartnerMpConnection | CLIENT_ID/SECRET + enablement PSP | não | SPLIT_REQUIRES_MP_ENABLEMENT |
| Supabase Postgres | DB | LAUNCH_REQUIRED | — | Prisma | sim | DATABASE_URL, DIRECT_URL | prisma | READY no homolog; Production migrate pendente |
| Supabase Storage | files | LAUNCH_OPTIONAL | uploads via Cloudinary no social | stub | — | SUPABASE_STORAGE_* | — | DISABLED se não usado |
| Cloudinary | mídia | LAUNCH_REQUIRED se uploads | sim | sim | URLs | CLOUDINARY_* | admin test | CONFIGURED_NOT_VERIFIED |
| GA4 / GTM | analytics | LAUNCH_OPTIONAL | providers | — | — | NEXT_PUBLIC_GA_MEASUREMENT_ID / GTM_ID | consent | OPTIONAL |
| Google Maps | mapas | LAUNCH_OPTIONAL | mapa | geocode | coords | NEXT_PUBLIC_GOOGLE_MAPS_API_KEY | — | OPTIONAL |
| Better Stack | observabilidade | LAUNCH_OPTIONAL | — | logger | — | BETTERSTACK_* se existir | — | OPTIONAL |
| Firebase FCM | push | LAUNCH_OPTIONAL | — | sim | — | FIREBASE_* | — | OPTIONAL |
| Turnstile | bot | FEATURE_FLAGGED | não no cadastro | server | — | TURNSTILE_* | — | FEATURE_FLAGGED / não no Google |
| Stripe / Pagar.me | pagamentos alt | FUTURE_ONLY | admin catálogo | parcial | — | — | — | FUTURE_ONLY |
| Amazon / Shopee | canais | FUTURE_ONLY | — | não | — | — | — | FUTURE_ONLY |
| VLibras | acessibilidade | LAUNCH_OPTIONAL | widget | — | — | VLIBRAS_ENABLED | smoke | OPTIONAL |
| Mapbox | mapas alt | FUTURE_ONLY | stub | — | — | — | — | FUTURE_ONLY |

Admin: `/admin/integracoes` — status real, sem secrets.
