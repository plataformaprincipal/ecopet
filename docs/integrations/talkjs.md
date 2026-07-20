# TalkJS

## Variáveis

```
NEXT_PUBLIC_TALKJS_APP_ID=
TALKJS_SECRET_KEY=
TALKJS_ENVIRONMENT=test
TALKJS_API_BASE_URL=https://api.talkjs.com
TALKJS_WEBHOOK_SECRET=
TALKJS_WEBHOOK_VERIFY=1
```

- Testes: `npm run test:talkjs -w @ecopet/web` e `npm run test:foundation:talkjs`
- Health admin: `/admin/messaging` → `GET /api/admin/messaging/health`
- Docs: [docs/messaging/README.md](../messaging/README.md)

Sem chaves, a UI de mensagens mostra estado indisponível (não quebra o app).
