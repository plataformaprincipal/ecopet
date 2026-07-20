# Setup TalkJS (Test → Live)

## Test Mode (agora)

1. Dashboard TalkJS → App de teste
2. Copiar App ID → `NEXT_PUBLIC_TALKJS_APP_ID`
3. Copiar Secret Key → `TALKJS_SECRET_KEY`
4. `TALKJS_ENVIRONMENT=test`
5. Identity Verification: Settings → Security (usar mesma secret)
6. Webhook (depois): URL `https://<host>/api/webhooks/talkjs`
7. Copiar webhook secret → `TALKJS_WEBHOOK_SECRET`
8. `TALKJS_WEBHOOK_VERIFY=1`

## Live Mode (antes do lançamento)

1. App Live no TalkJS
2. Novas variáveis na Vercel (não misturar com test)
3. `TALKJS_ENVIRONMENT=production`
4. Webhook Live + `TALKJS_WEBHOOK_SECRET` obrigatório
5. Domínio oficial no TalkJS
6. Deploy + smoke `GET /api/admin/messaging/health`
