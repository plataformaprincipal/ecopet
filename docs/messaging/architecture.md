# Arquitetura de mensagens

```
[UI TalkJS Inbox/Chatbox]
        │
        ▼
GET /api/messages/talkjs/session  → HMAC identity (secret só no server)
        │
POST /api/messages/conversations[/contextual]
        │
        ├─ Prisma Conversation (metadados + talkjsConversationId)
        └─ TalkJS REST sync users/conversations

TalkJS ──webhook──▶ POST /api/webhooks/talkjs
                       ├─ HMAC verify
                       ├─ WebhookEvent idempotency
                       └─ Notification (dedupe)
```

Permissões: `assertPersonaCanMessage` + ownership em factories contextuais.
IA: apenas rascunhos (`MSG_FLAG_AI`).
