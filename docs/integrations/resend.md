# Resend (e-mail)

## Variáveis
```
EMAIL_PROVIDER=resend
RESEND_API_KEY=
EMAIL_FROM=
EMAIL_REPLY_TO=
```

## Sem chave
- Recuperação OTP: com `AUTH_TEST_EXPOSE_OTP=1` em testes; em produção sem chave → falha sanitizada / não envia
- Canais de notificação: `SKIPPED_NOT_CONFIGURED`
- Nunca retornar “e-mail enviado” sem provider

## Ativação
1. Conta Resend + domínio verificado
2. Preencher `RESEND_API_KEY` e `EMAIL_FROM`
3. Smoke no admin
4. Testar forgot-password
