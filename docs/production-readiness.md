# Production readiness — EcoPet

## Já validado localmente (sem depender de provedores pagos)

- [x] type-check / lint / build (heap 8GB)
- [x] Auth CLIENT/PARTNER/ONG ACTIVE + login imediato
- [x] test:foundation:auth / security / talkjs 9/9 / marketplace / i18n / no-mocks / sync-env
- [x] Registry de integrações + painel `/admin/integracoes` + smoke ADMIN
- [x] IA retorna `AI_NOT_CONFIGURED` sem chave (sem sucesso falso)
- [x] Pagamento manual/none sem marcar pago
- [x] Canais e-mail/sms/push skipped quando ausentes (`SKIPPED_NOT_CONFIGURED`)
- [x] NotificationDispatcher + auditoria via `NotificationDispatch` / `NotificationDispatchLog`
- [x] Composer IA exige “Revisar e confirmar” antes de aplicar texto
- [x] 2FA e sessões cosméticas marcadas “Em preparação”
- [x] Fake providers somente com `NODE_ENV=test`

## Modelos Prisma (nomes canônicos)

| Solicitado na auditoria | Modelo real no schema |
| ----------------------- | --------------------- |
| EmailDeliveryLog        | `EmailLog`            |
| NotificationDelivery    | `NotificationDispatch` + `NotificationDispatchLog` |
| PaymentTransaction      | `Payment` + `PaymentEvent` |
| UploadAsset             | `UploadAsset`         |

## Checklist por credencial

1. Preencher variável no Vercel / `.env` local (nunca no Git)
2. Reiniciar o processo Next.js
3. Abrir `/admin/integracoes` e conferir status
4. Executar smoke test ADMIN
5. Verificar AuditLog / IntegrationLog
6. Habilitar feature flag (`AI_ENABLED`, `PAYMENT_PROVIDER`, etc.)
7. Monitorar erros e custo

## Antes de produção com credenciais

1. Secrets reais no Vercel
2. `AI_ENABLED=true` + billing OpenAI
3. Resend com domínio verificado
4. Cloudinary (desligar `UPLOAD_DEV_FALLBACK` em prod)
5. TalkJS App ID + secret
6. `PAYMENT_PROVIDER` + webhooks assinados
7. Smoke no admin
8. Revisar CSP / rate-limit multi-instância
9. CI já inclui cart/orders/social/notifications/ai

## Matriz de integrações

| Integração     | Frontend | Backend | Banco | Provider | Sem chave | Pronto para chave | Teste                         | Status               |
| -------------- | -------- | ------- | ----- | -------- | --------- | ----------------- | ----------------------------- | -------------------- |
| OpenAI         | Sim      | Sim     | Uso/audit | SDK    | `AI_NOT_CONFIGURED` | Sim            | foundation:ai / admin smoke   | PRONTO PARA CREDENCIAL |
| Resend         | N/A      | Sim     | EmailLog | Resend | `EMAIL_NOT_CONFIGURED` / SKIPPED | Sim | admin smoke / recovery       | PRONTO PARA CREDENCIAL |
| Twilio         | N/A      | Sim     | logs  | Twilio   | SMS_NOT_CONFIGURED / SKIPPED | Sim | admin smoke / recovery SMS | PRONTO PARA CREDENCIAL |
| TalkJS         | Sim      | Sim     | Conversation | TalkJS | mensagem indisponível | Sim | foundation:talkjs 9/9     | FUNCIONAL LOCAL*     |
| Cloudinary     | Upload UI| Sim     | UploadAsset | Cloudinary / local_dev | bloqueio prod / fallback dev | Sim | admin smoke              | PRONTO PARA CREDENCIAL |
| Mercado Pago   | Admin    | Adapter | Payment | MP     | PENDING_CONFIRMATION | Sim          | admin payment smoke           | PRONTO PARA CREDENCIAL |
| Stripe         | Admin    | Adapter | Payment | Stripe | PENDING_CONFIRMATION | Sim          | admin payment smoke           | PRONTO PARA CREDENCIAL |
| Push (VAPID)   | Prefs    | Stub    | Dispatch| —      | SKIPPED_NOT_CONFIGURED | Parcial     | channel status                | PARCIAL / OCULTO COM SEGURANÇA |
| Supabase DB    | —        | Sim     | Prisma  | PG     | N/A       | Sim               | health / auth                 | FUNCIONAL LOCAL      |
| Notificações in-app | Sino | Sim  | Notification | —   | Funciona  | Sim               | foundation:notifications      | FUNCIONAL LOCAL      |
| Pagamento manual | Checkout | Sim   | Order/Payment | manual | pedido pendente | Sim         | marketplace/orders            | FUNCIONAL LOCAL      |

\*TalkJS: funcional **com** App ID + secret já presentes no ambiente local de teste; sem chaves, UI degrada com mensagem clara.

## Classificação atual

**Beta / pronto para credencial** em várias frentes — **não** afirmar que OpenAI, e-mail, SMS, upload cloud ou pagamento externo estão “funcionando” sem chave + smoke real.
