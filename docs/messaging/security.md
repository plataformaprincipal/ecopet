# Segurança TalkJS / mensagens

- Secret Key apenas no servidor
- Usuário TalkJS = sessão EcoPet (nunca userId arbitrário do body)
- HMAC Identity Verification
- Webhook: HMAC-SHA256(`timestamp.body`) hex uppercase
- Produção exige `TALKJS_WEBHOOK_SECRET`
- IDOR: factories ORDER/PRODUCT/SERVICE validam ownership
- Persona matrix bloqueia CLIENT↔CLIENT e PARTNER↔PARTNER
- Logs sem secrets / sem corpo completo de mensagem
- Feature flags `MSG_FLAG_*` para rollback
