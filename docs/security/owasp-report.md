# OWASP Top 10 Report — EcoPet

**Data:** 2026-07-20  
**Referência:** OWASP Top 10:2021 (+ controles clássicos CSRF, SSRF, Clickjacking, Open Redirect, Path Traversal, Command Injection, Prompt Injection)

---

## Mapa de controles

| OWASP | Nome | Resultado | Evidência / notas |
|-------|------|-----------|-------------------|
| A01 | Broken Access Control | **Pass com ressalva** | RBAC unit 43/43; ownership em APIs; HTTP IDOR suite não fechou nesta rodada |
| A02 | Cryptographic Failures | **Pass** | Cookies Secure/httpOnly; secrets server-only; redaction em logs |
| A03 | Injection | **Pass** | Prisma parametrizado; sem `$queryRawUnsafe` app; upload/HTML SVG bloqueados |
| A04 | Insecure Design | **Pass parcial** | Fail-closed MP/auth rate-limit; Turnstile opcional se desligado — risco ops |
| A05 | Security Misconfiguration | **Fail parcial (Homolog)** | CSP `unsafe-inline`/`unsafe-eval`; deps High; env Live incompleto |
| A06 | Vulnerable Components | **Fail (High)** | `npm audit --omit=dev`: 5 High, 0 Critical |
| A07 | Identification & Auth Failures | **Pass** | Sessão endurecida; rate limit; sem enumeração; OTP teste bloqueado em prod |
| A08 | Software & Data Integrity | **Pass** | Webhooks MP/TalkJS assinados; idempotência |
| A09 | Security Logging & Monitoring | **Pass parcial** | Correlation ID + redact; Better Stack não configurado localmente |
| A10 | SSRF | **Pass** | Fetch outbound limitado a providers conhecidos; uploads não fazem fetch arbitrário de URL usuário |

---

## Controles adicionais

| Controle | Resultado | Detalhe |
|----------|-----------|---------|
| XSS | Pass parcial | Sanitização/API sanitize; CSP permissivo reduz eficácia |
| CSRF | Pass parcial | SameSite=Lax; sem token CSRF dedicado em mutações JSON same-site |
| Clickjacking | Pass | `X-Frame-Options: SAMEORIGIN` + `frame-ancestors 'self'` |
| Open Redirect | Pass | `safe-url` Firebase; redirects internos validados |
| Path Traversal | Pass | Upload local-dev sanitiza path; Cloudinary via API assinada |
| Command Injection | Pass | Sem shell com input de usuário em rotas auditadas |
| XXE | Pass / N/A | SVG/XML upload bloqueados; sem parser XML de usuário |
| Insecure Deserialization | Pass | JSON tipado; sem unpickle/eval de payload |
| Sensitive Data Exposure | Pass parcial | Export LGPD mascara CPF/CNPJ; logs redigidos; cuidado com Better Stack |
| Prompt Injection (OpenAI) | Pass (unit) | Firewall bloqueia jailbreak/exfil/indirect |
| Indirect Prompt Injection | Pass (unit) | Padrões script/html/system tags |
| Replay (webhooks) | Pass | Skew + idempotency MP |
| Rate limit | Pass | Auth + AI endpoints; bypass flags bloqueadas em prod |

---

## Conclusão OWASP

Controles de aplicação cobrem a maior parte do Top 10 para **homologação**.  
Bloqueadores para declaração de produção: **A05** (misconfig/CSP/env), **A06** (componentes High), e lacuna de prova dinâmica em **A01**.
