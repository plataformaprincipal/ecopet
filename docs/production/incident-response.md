# Resposta a incidentes

| Cenário | Ação |
|---|---|
| App down | Uptime → Vercel status → rollback |
| DB down | Supabase status → restore → ready check |
| OpenAI down | `AI_ENABLED=false` / `OPENAI_PAUSED` |
| TalkJS down | `MSG_FLAG_*` off; status page |
| MP down | Pausar checkout; reconciliar depois |
| Firebase down | Canal in-app/email |
| Resend down | Retry + status operacional |
| Upload down | Bloquear upload; mensagem clara |
| Secret leak | Rotacionar; revogar; Better Stack search |
| Pagamento duplicado | Idempotência + conciliação admin |
| Ataque | Rate limit; Turnstile; suspender IPs; audit |

Runbooks detalhados: `docs/observability/incident-response.md`
