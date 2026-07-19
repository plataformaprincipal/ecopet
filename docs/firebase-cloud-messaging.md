# Firebase Cloud Messaging (EcoPet)

Integração FCM Web de ponta a ponta: cliente, service worker, Admin SDK (HTTP v1), banco, preferências, orquestrador de canais e painel admin.

## Arquitetura

```
Browser (Firebase Web SDK)
  → permission (gesto do usuário)
  → getToken(VAPID)
  → POST /api/notifications/push/register (sessão)
  → PushDevice (token cifrado + hash)

Evento EcoPet
  → createInternalNotification / dispatchNotification
  → canais: IN_APP + PUSH (+ e-mail se habilitado)
  → sendPushToUser (Firebase Admin)
  → PushNotificationDelivery (SENT / FAILED / INVALID_TOKEN / …)

Background: public/firebase-messaging-sw.js
Foreground: ForegroundNotificationListener (toast acessível)
```

Firebase Authentication **não** é utilizado. A autenticação do EcoPet permanece a atual.

## Variáveis (somente nomes)

**Públicas (cliente / SW via endpoint):**

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
- `NEXT_PUBLIC_FIREBASE_VAPID_KEY`

**Servidor:**

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (aceita `\n` literais; normalizado no Admin)
- `FIREBASE_MESSAGING_ENABLED` (opcional)

`AUTH_SECRET` / `NEXTAUTH_SECRET` é usado para cifrar tokens em repouso (AES-256-GCM).

## Service worker

Arquivo: `apps/web/public/firebase-messaging-sw.js`

Configuração pública carregada em runtime de `GET /api/firebase/messaging-config` (apenas `NEXT_PUBLIC_*`). Sem Service Account. Sem hardcode de segredos.

O SW legado `public/sw.js` permanece para Web Push VAPID. Novos registros FCM usam `firebase-messaging-sw.js`.

## Tokens

- Hash SHA-256 para deduplicação (`tokenHash` único)
- Token original cifrado (`encryptedToken`) — necessário para envio
- Nunca retornado em APIs admin / logs
- `userId` sempre da sessão (body `userId` ignorado)
- Logout desativa apenas o `deviceId` atual

## Banco

- `PushDevice`
- `PushNotificationDelivery`
- Migration: `20260719030000_fcm_push_devices`

Preferências reutilizam `NotificationPreference` (`pushEnabled`, categorias, `marketingEnabled`).

## Preferências e canais

Orquestrador: `dispatchNotification` / `createInternalNotification` (in-app + push).

Marketing exige `marketingEnabled`. Segurança tem tratamento próprio. Notificações internas (in-app) continuam mesmo com push desativado.

## Admin

- `/admin/integracoes/firebase` — diagnóstico sanitizado + teste neste dispositivo
- `/admin/notificacoes/push` — broadcast por role com confirmação `ENVIAR`
- `/admin/seguranca/dispositivos` — lista sem tokens
- `GET /api/admin/integrations/firebase/diagnostics`

## Segurança / LGPD

- RBAC ADMIN nas rotas admin
- Rate limit
- URLs internas sanitizadas (anti open-redirect)
- Payload resumido (sem CPF, cartão, mensagem privada completa)
- Revogação por dispositivo; exclusão de conta deve desativar `PushDevice` (cascade User)

## Vercel

- Private key com `\n` escapado
- Singleton Admin com cache em `globalThis` (hot reload / serverless)
- Build não chama FCM externamente
- Bundle cliente não inclui `firebase-admin`

## Troubleshooting

| Sintoma | Verificação |
|---------|-------------|
| SW 503 config | Variáveis `NEXT_PUBLIC_FIREBASE_*` + VAPID |
| Register 503 | Admin + client configurados |
| Permissão DENIED | Instruções no browser; não re-pedir em loop |
| SENT mas sem banner | Foreground listener / app em background / tag |
| Token inválido | `INVALID_TOKEN` + `active=false` |

## Rotação da service account

1. Criar nova chave no Google Cloud / Firebase
2. Atualizar `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY` na Vercel
3. Redeploy
4. Revogar chave antiga após validar envio de teste

## Testes

```bash
npm run test:firebase -w @ecopet/web
```
