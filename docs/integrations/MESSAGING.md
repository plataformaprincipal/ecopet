# Messaging (TalkJS)

Social 1:1 usa TalkJS. SupportTicket **não** foi migrado.

- IDs: `user.id` EccoPet (não e-mail).
- Conversation id determinístico (`buildTalkJsConversationId`).
- Secret: `TALKJS_SECRET_KEY` server-only.
- Sem credencial: 503 + mensagem operacional. Sem chat falso.
- Auth: usuário ativo; alvo válido; sem self-message; bloqueios.

Ver também [talkjs.md](./talkjs.md).
