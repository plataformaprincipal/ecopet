# Segurança Final — IA

## Controles ativos

1. Prompt Firewall (injection, jailbreak, leakage, exfil, tool abuse)
2. Sanitize PII/secrets (input + tool results)
3. OpenAI Moderation (in/out)
4. RBAC / personas / tool permissions
5. Rate limit multi-camada
6. `AISecurityEvent` + `AIAuditLog`
7. Barrel `server-only` (sem vazamento de secrets no client)

## Nunca enviar à OpenAI

CPF, telefone, senha, cookies, JWT, Authorization, cartões, Pix, dados médicos/bancários, env secrets, prompts internos, logs internos.

## Testes de segurança

`enterprise.test.ts` + `production.integration.test.ts` + load de jailbreak flood.
