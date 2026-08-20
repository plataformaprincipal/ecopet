# Integration health

- Configuration check ≠ live provider check.
- Admin: `GET /api/admin/integrations/status` (requireAdmin).
- Smoke: `POST /api/admin/integrations/{provider}/test` com confirmação; AuditLog; rate limit.
- Gate de lançamento: `apps/web/src/lib/integrations/launch-health.ts`.

Google Auth configurado no código ainda é **EXTERNAL_CONFIG_REQUIRED** até o redirect URI existir no Google Cloud.

Mercado Pago checkout pode estar READY_PAYMENT com **SPLIT_REQUIRES_MP_ENABLEMENT**.

OpenAI: não envia `OPENAI_PROJECT_ID` a menos que `OPENAI_SEND_PROJECT=1`.
