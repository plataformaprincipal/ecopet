# Resend (e-mail transacional) — EcoPet

Infraestrutura enterprise de e-mail do EcoPet. O envio usa **exclusivamente** `process.env.RESEND_API_KEY` (nunca hardcode, nunca em logs/HTTP).

## Variáveis

```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxx          # obrigatória para envio
EMAIL_FROM=EcoPet <noreply@eccopet.com>
EMAIL_FROM_NAME=EcoPet
EMAIL_REPLY_TO=suporte@eccopet.com
EMAIL_SUPPORT=suporte@eccopet.com
# Após DNS do domínio verificado no painel Resend:
EMAIL_DOMAIN_VERIFIED=true
```

Aliases aceitos para remetente: `RESEND_FROM_EMAIL`, `RESEND_FROM`, `SMTP_FROM_EMAIL`.

### Status no admin (`/admin/integracoes`)

| Status | Significado |
|--------|-------------|
| `NOT_CONFIGURED` | `RESEND_API_KEY` ausente/placeholder |
| `CONFIGURED` | (interno) chave presente |
| `DOMAIN_PENDING` | chave ok, mas sandbox (`@resend.dev`) **ou** domínio custom sem `EMAIL_DOMAIN_VERIFIED=true` |
| `ACTIVE` | chave + domínio marcado como verificado |
| `ERROR` | último envio falhou (mensagem sanitizada) |

**Build nunca falha** se o domínio ainda não estiver verificado.

## Arquitetura

```
lib/email/config.ts          → variáveis (from, reply-to, support)
lib/email/resend.ts          → cliente Resend singleton
lib/email/email-service.ts   → sendEmail() (cc/bcc/replyTo/tags/…)
lib/email/errors.ts          → erros sanitizados (401/403/422/429/5xx/DNS/domínio)
lib/email/resend-status.ts   → status operacional admin
lib/email/provider.ts        → multi-provedor + EmailLog Prisma (Resend via sendEmail)
lib/email/templates/*        → HTML responsivo EcoPet
lib/mail/event-dispatch.ts   → fluxos (auth, pedidos, parceiro/ONG, admin)
```

## Como trocar o remetente

1. Verifique o domínio no [Resend Domains](https://resend.com/domains)
2. Atualize `EMAIL_FROM` (ex.: `EcoPet <noreply@eccopet.com>`)
3. Defina `EMAIL_REPLY_TO` / `EMAIL_SUPPORT`
4. Após DNS ok: `EMAIL_DOMAIN_VERIFIED=true`
5. Redeploy na Vercel

## Como alterar / adicionar templates

- Templates base: `apps/web/src/lib/email/templates/render.ts` + `i18n/copy.ts`
- Templates enterprise: `apps/web/src/lib/email/templates/enterprise.ts`
1. Crie `renderXEmail()` reutilizando `emailLayout` / blocos
2. Exporte em `templates/index.ts`
3. Registre em `renderEmailTemplate` (`types.ts` + switch)
4. Dispare via `dispatchPremiumEmail` / helper em `event-dispatch.ts`

## Fluxos conectados

| Fluxo | Entrada |
|-------|---------|
| Recuperação de senha (OTP) | `password-recovery-email.ts` → `sendEmail` |
| Cadastro / boas-vindas | `emailRegisterCompleted` |
| Senha alterada | `emailPasswordChanged` |
| Parceiro/ONG aprovado/rejeitado | `accounts-service` + templates enterprise |
| Pedidos | `emailOrderEvent` / `emailOrderShipped` |
| Notificações canal e-mail | `notifications/channels/email.ts` |
| Teste admin | `POST /api/admin/test-email` |

## Endpoint de teste (ADMIN)

```http
POST /api/admin/test-email
Content-Type: application/json

{ "to": "voce@exemplo.com" }
```

- Apenas role ADMIN
- Rate limit (5/min por usuário+IP)
- Resposta mascara o destinatário; nunca retorna a API key

Smoke config (sem envio): `POST /api/admin/integrations/resend/test`

## Domínio eccopet.com (checklist DNS)

1. No Resend → Domains → Add `eccopet.com`
2. Publique os registros SPF / DKIM / (opcional) DMARC no DNS
3. Aguarde propagação (pode levar minutos a 48h)
4. Status do domínio = **Verified** no Resend
5. `EMAIL_FROM=EcoPet <noreply@eccopet.com>` (ou outro mailbox do domínio)
6. `EMAIL_DOMAIN_VERIFIED=true` no `.env` / Vercel
7. Envie teste pelo admin → status deve ir para `ACTIVE`
8. Valide forgot-password com e-mail real

## Segurança

- Nunca logar `RESEND_API_KEY`
- Destinatários validados (regex + bloqueio CR/LF)
- Assunto/headers sanitizados (anti header-injection)
- HTML dos templates com `escapeHtml` em dados dinâmicos
- Erros públicos sanitizados (sem stack)

## Testes

```bash
npm run test:email
npm run lint
npm run type-check
npm run build
```
