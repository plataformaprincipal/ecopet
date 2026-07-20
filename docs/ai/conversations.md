# Assistente — Segurança

- Sanitização de CPF/e-mail/telefone/JWT/Bearer/cartão no input
- Contexto mínimo (`buildMinimalContext`) — sem PII de perfil sensível
- Rate limit por usuário + IP
- RBAC: `requireAuth` no chat; admin analytics com `requireAdmin`
- Logs/audit sem prompt integral
- Streaming cancela via AbortSignal do request

Ver também `docs/ai/security.md` (fundação).
