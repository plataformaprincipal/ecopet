# Google Tag Manager — Segurança & LGPD

## Controles

- APIs admin: `requireAdmin` + rate limit (`gtm-admin:*`)
- Claim: `requireAuth` + rate limit (`telemetry-claim:*`)
- PATCH config: mass-assignment limitado a flags booleanas / diagnosticLevel
- Logs: sem tokens, cookies, e-mail, CPF, payloads integrais
- Headers: rotas admin `force-dynamic` / no-store via padrões existentes
- Container ID mascarado no painel e logs

## LGPD

- Consent Mode no frontend; backend não decide cookie do browser
- Negar analytics não bloqueia funcionalidades EcoPet
- Dedup armazena apenas hashes
- Sem conteúdo de mensagens / prompts / cartão

## OWASP (resumo)

| Risco | Mitigação |
|-------|-----------|
| Broken Access Control | ADMIN / Auth |
| Injection | Prisma + Zod/validação manual |
| Sensitive Data Exposure | máscara + sanitização |
| Logging Failures | logger dedicado |
| Rate Limit Abuse | checkRateLimit |
| CSRF | cookies session + SameSite do auth existente |

## Segredos

Não persistir API secrets GTM/GA no painel. Measurement Protocol fora de escopo sem credenciais explícitas.
