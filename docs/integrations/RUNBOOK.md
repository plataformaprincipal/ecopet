# Runbook — providers de lançamento

Não desabilitar área não relacionada. Secrets nunca em log.

## Google Auth down

- Impacto: botão Google falha; e-mail/senha continua.
- Detectar: `/login?google=` / admin google_auth NOT_CONFIGURED / redirect Google 400.
- Fallback: login senha + reset Resend.
- Owner: Auth.

## Resend down

- Impacto: reset/e-mails transacionais falham; pedido/pagamento **não** reverte.
- Detectar: admin Resend test; delivery FAILED.
- Fallback: in-app; reenvio manual.
- Owner: Comunicação.

## Twilio down

- Impacto: OTP SMS. Cadastro e Google não dependem.
- Fallback: e-mail.
- Owner: Comunicação.

## TalkJS down

- Impacto: Mensagem social indisponível. Feed continua.
- Detectar: 503 TALKJS_NOT_CONFIGURED; UI `messagesModule.configError`.
- Fallback: não criar conversa falsa.
- Owner: Social.

## OpenAI down

- Impacto: assistente indisponível; restante do app funciona.
- Detectar: AI_NOT_CONFIGURED / 503.
- Fallback: mensagem operacional, sem texto inventado.
- Owner: AI.

## Mercado Pago down

- Impacto: checkout bloqueado. Nunca simular aprovação.
- Split: continua SPLIT_REQUIRES_MP_ENABLEMENT até o PSP habilitar.
- Owner: Financeiro.

## Cloudinary down

- Impacto: upload de mídia falha (avatar, pet, social, produto). Perfil e restante do app continuam.
- Detectar: falha de upload no cliente; admin Cloudinary last check ERROR.
- Fallback: mensagem operacional; não gravar URL falsa; retry posterior.
- Owner: Mídia.

## Supabase down

- Impacto: app inteiro. Não migrate Production nesta missão.
- Detectar: Prisma connection error (sem DATABASE_URL no log).
- Owner: Infra.
