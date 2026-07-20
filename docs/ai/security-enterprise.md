# Segurança Enterprise da IA

## Camadas

1. Prompt Firewall (`enterprise/prompt-firewall.ts`)
2. Sanitize PII/secrets (`utils/sanitize-input.ts`)
3. OpenAI Moderation
4. RBAC / personas / tool permissions
5. Rate limit (user, IP, sessão, perfil, tool, endpoint)
6. `AISecurityEvent` para auditoria

## Nunca enviar à OpenAI

JWT, cookies, Authorization, secrets, senhas, tokens, Pix, cartões, CPF, dados médicos completos, prompts internos, variáveis de ambiente.
