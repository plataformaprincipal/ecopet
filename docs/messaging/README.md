# Mensagens EcoPet + TalkJS

## Fonte de verdade

| Dado | Onde |
|---|---|
| Conteúdo das mensagens | **TalkJS** |
| Vínculo conversa ↔ entidade EcoPet | PostgreSQL `Conversation.talkjsConversationId` + `contextType`/`contextId` |
| Participantes / mute / archive | `ConversationParticipant` |
| Notificações | EcoPet `Notification` (webhook + create conversation) |
| Eventos webhook | `WebhookEvent` (provider=`talkjs`, idempotência) |

Não duplicamos o histórico completo de mensagens no Postgres.

## Variáveis

| Var | Escopo |
|---|---|
| `NEXT_PUBLIC_TALKJS_APP_ID` | Público (browser) |
| `TALKJS_SECRET_KEY` | **Somente servidor** |
| `TALKJS_ENVIRONMENT` | `test` \| `production` |
| `TALKJS_API_BASE_URL` | default `https://api.talkjs.com` |
| `TALKJS_WEBHOOK_SECRET` | Preferido para webhooks |
| `TALKJS_WEBHOOK_VERIFY=1` | Força verificação HMAC |
| `MSG_FLAG_*` | Feature flags |

Nunca criar `NEXT_PUBLIC_TALKJS_SECRET_KEY`.

## Endpoints

- `GET /api/messages/talkjs/session` — sessão HMAC (usuário da sessão)
- `POST /api/messages/conversations` — criar/obter
- `POST /api/messages/conversations/contextual` — PRODUCT/SERVICE/ORDER/SUPPORT/ADOPTION com ownership
- `POST /api/webhooks/talkjs` — eventos + notificações deduplicadas
- `GET /api/admin/messaging/health` — health sanitizado
- `POST /api/messages/ai/suggest-reply` — rascunho IA (não envia)

## UI

- Central: `/dashboard/messages` (TalkJS Inbox + Chatbox)
- `/marketplace/chat` → redireciona para a central com query `partner`

## Testes

```bash
npm run test:talkjs -w @ecopet/web
npm run test:foundation:talkjs
```
