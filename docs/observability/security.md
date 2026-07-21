# Segurança e privacidade (observabilidade)

- Redaction recursiva (ver `redaction.md`)
- Eventos de segurança: `captureSecurityEvent` (login falho, rate limit, webhook inválido)
- LGPD: minimização; não é auditoria jurídica completa
- Admin `/admin/observability` exige `requireAdmin`
- Teste controlado: `POST /api/internal/observability/health` com `{ confirm: true }`
