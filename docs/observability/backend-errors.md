# Erros de backend

Wrappers:

- `withApiTelemetry(module, handler)` — rotas
- `withServerActionTelemetry(name, fn)` — actions
- `withJobTelemetry(name, fn)` — jobs

Instrumentados prioritariamente: auth/login, webhooks Mercado Pago e TalkJS, OpenAI gateway, Resend, Cloudinary, Firebase push.
