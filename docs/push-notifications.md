# Push Notifications — EcoPet

Visão operacional do canal push (FCM + Web Push legado).

## Canais

| Canal | Tecnologia | Quando |
|-------|------------|--------|
| FCM | Firebase Admin HTTP v1 | Preferencial quando Admin + Web SDK configurados |
| Web Push | `web-push` + VAPID | Fallback / dispositivos já inscritos em `/sw.js` |
| In-app | tabela `Notification` | Sempre via dispatcher (se preferência permitir) |
| E-mail | Resend/SMTP | Somente se `emailEnabled` e canal pedido |

## Consentimento

1. Usuário clica em “Ativar notificações”
2. Browser pede permissão
3. Token FCM é registrado no backend autenticado
4. `NotificationPreference.pushEnabled` passa a `true`

Não solicitar permissão automaticamente no carregamento da página.

## Eventos

`createInternalNotification` (pedidos, pagamentos, agenda, social, mensagens, admin) passa pelo orquestrador e pode gerar push se:

- FCM/VAPID configurado
- preferência `pushEnabled` (exceto regras de segurança)
- categoria correspondente habilitada
- dispositivo ativo

Idempotência: `metadata.idempotencyKey` ou `notif:{notificationId}:push`.

## APIs do usuário

- `POST /api/notifications/push/register`
- `POST /api/notifications/push/unregister`
- `GET /api/notifications/push/status`
- `GET` / `PUT /api/notifications/preferences`

## UI

- Preferências: painel existente + ativação FCM
- Componentes: `components/notifications/*`
- Hooks: `use-push-notifications`, `use-fcm-token`

## Produção — checklist

- [ ] Variáveis Firebase na Vercel (Production + Preview)
- [ ] Deploy concluído
- [ ] Service worker `/firebase-messaging-sw.js` acessível
- [ ] Admin → Integrações → Firebase = READY
- [ ] Permissão concedida no browser
- [ ] Token registrado (`PushDevice.active`)
- [ ] Teste admin recebido em foreground
- [ ] Teste recebido em background
- [ ] Clique abre rota interna correta
- [ ] Token inválido marcado inativo
- [ ] Métricas no painel refletem envios

Enquanto itens acima não forem validados no ambiente real, o status operacional é **código pronto / produção pendente de validação**.
