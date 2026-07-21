# Risk Matrix — EcoPet Security Audit

**Data:** 2026-07-20  
**Severidades:** Crítica · Alta · Média · Baixa · Informativa  
**Status:** Aberto · Mitigado · Aceito · Resolvido · Evidência incompleta

---

## Matriz

| ID | Vulnerabilidade / Risco | Severidade | OWASP | Arquivo / Superfície | Impacto | Correção | Status |
|----|-------------------------|------------|-------|----------------------|---------|----------|--------|
| R-001 | Dependência `ws` DoS (fragment flood) via engine.io/socket.io | Alta | A06 | `node_modules` / realtime stack | Indisponibilidade se WS exposto | Upgrade engine.io/socket.io/`ws` | Aberto |
| R-002 | `form-data` CRLF em multipart | Alta | A06 / A03 | Cadeia transitiva upload HTTP | Manipulação de requisições multipart | Bump `form-data` na árvore | Aberto |
| R-003 | `nodemailer` SMTP injection (`envelope.size`) via next-auth | Alta | A06 / A03 | `next-auth` → nodemailer | Comando SMTP se envelope atacável | Atualizar nodemailer/next-auth; auditar uso | Aberto |
| R-004 | Suite HTTP `test:security` / servidor estável 500 | Alta | A05 | `scripts/start-stable-test-server.mjs`, `:3002` | Sem prova dinâmica IDOR/auth nesta rodada | Estabilizar health + reexecutar suite | Evidência incompleta |
| R-005 | Mercado Pago Live / `PAYMENT_PROVIDER` incompleto no env | Alta | A04 / A08 | env + `lib/mercado-pago/*` | Pagamentos não validados em Live; risco ops go-live | Ativar Live + secret + smoke | Aberto (ops) |
| R-006 | Webhook MP sem secret em produção | — (controlado) | A08 | `webhooks/pipeline.ts` | Antes: fraude; agora fail-closed 503 | Manter secret obrigatório | Mitigado |
| R-007 | CSP `unsafe-inline` + `unsafe-eval` | Média | A05 / XSS | `lib/security/headers.ts` | XSS mais fácil se houver sink | Nonces + sandbox VLibras | Aceito temporário |
| R-008 | `connect-src https:` amplo | Média | A05 / SSRF* | `headers.ts` | Exfil via browser a qualquer HTTPS | Allowlist hosts | Aberto |
| R-009 | Sem token CSRF dedicado | Média | A01 | APIs cookie session | CSRF em browsers antigos / edge cases | Double-submit ou Origin check | Aberto |
| R-010 | Turnstile desligado se não configurado | Média | A07 | `lib/turnstile/*` | Abuso de registro/bots | Exigir Turnstile em produção | Aberto (ops) |
| R-011 | TalkJS `TALKJS_APP_ID` ausente local | Média | A05 | env TalkJS | Chat Live não validado | Configurar Live + smoke HMAC | Aberto (ops) |
| R-012 | Firebase public config incompleta | Média | A05 | env Firebase | Push não validado em prod | Completar config + smoke | Aberto (ops) |
| R-013 | Better Stack tokens ausentes | Média | A09 | observability env | Sem monitoramento segurança em prod | Configurar + alertas | Aberto (ops) |
| R-014 | LGPD retenção / DPO MANUAL | Média | A04 | `lgpd-checklist.ts`, privacy-service | Não conformidade operacional | Política + SLA + purge | Aberto |
| R-015 | Export LGPD parcial | Baixa | A04 | `privacy-service.ts` | Dados incompletos ao titular | Export completo sob DPO | Aceito parcial |
| R-016 | Upload sem AV malware scan | Baixa | A04 | `upload-constraints.ts` | Malware em PDF/imagem | ClamAV/Cloudinary moderation | Informativa |
| R-017 | npm Moderate (postcss, uuid, gaxios, GCS) | Baixa–Média | A06 | lockfile | Variado / limitado | Bumps rotineiros | Aberto |
| R-018 | Cookie session Secure forçado em prod | — | A07 | `auth-session.ts` | Antes: session hijack HTTP | Force-insecure ignorado | Mitigado |
| R-019 | Auth rate-limit bypass flags em prod | — | A07 | `rate-limit.ts` | Antes: brute force | Flags bloqueadas | Mitigado |
| R-020 | Prompt injection OpenAI | — | A03* | `prompt-firewall.ts` | Jailbreak / data leak | Firewall + rate limit | Mitigado (unit) |
| R-021 | IDOR ownership pets/orders/messages | — | A01 | APIs client/messages | Acesso cruzado | Filtros owner/membership | Mitigado (código/unit); HTTP live incompleto |
| R-022 | Escalada RBAC CLIENT→ADMIN | — | A01 | middleware + permissions | Privileges indevidos | Path matrix 43 testes | Mitigado (unit) |
| R-023 | SVG / XSS via upload | — | A03 | `DANGEROUS_EXTENSIONS` | Stored XSS | Extensão bloqueada | Mitigado |
| R-024 | Open redirect notificações | — | A01 | `firebase/safe-url.ts` | Phishing | Allowlist rotas internas | Mitigado |
| R-025 | TalkJS webhook sem HMAC | — | A08 | talkjs webhook security | Mensagens forjadas | HMAC strict | Mitigado (unit) |
| R-026 | Replay webhook MP | — | A08 | `webhooks/*` | Pagamento duplicado / fraude | Skew + idempotency | Mitigado |
| R-027 | Secrets em logs / Better Stack | Baixa | A02 / A09 | observability redaction | Vazamento PII/tokens | Redact + correlation id | Mitigado (código) |
| R-028 | Health leak host/env | — | A05 | `api/health` | Recon | Sanitizado | Mitigado |
| R-029 | Path traversal upload local | — | A01 | local-dev upload | Leitura FS | Sanitização path | Mitigado |
| R-030 | Clickjacking | — | A05 | XFO + frame-ancestors | UI redress | Headers | Mitigado |
| R-031 | AI_ENABLED=false / OpenAI key presente | Informativa | A05 | env | Superfície IA desligada | Liga só com firewall + budget | Informativa |
| R-032 | Licenças deps sem scan CI | Informativa | — | monorepo | Compliance legal | license-checker CI | Informativa |
| R-033 | SMTP Gmail 535 no register (QA) | Baixa | A05 | email ops | UX e-mail; API register pode seguir | App password / Resend | Aberto (ops, Prompt 3) |

\* Prompt injection mapeado analogamente a Injection / insecure design de LLM.

---

## Contagem por severidade (riscos abertos / evidência incompleta)

| Severidade | Qtd (abertos ou evidência incompleta) |
|------------|----------------------------------------|
| Crítica | **0** |
| Alta | **5** (R-001…R-005) |
| Média | **8** (R-007…R-014) |
| Baixa | **3** (R-015, R-017 parcial, R-033) |
| Informativa | **2** (R-031, R-032) |

Mitigados nesta matriz: R-006, R-018–R-030 (controles de código com evidência unit/static).

---

## Critérios de go-live vs. matriz

| Critério | Atende? |
|----------|---------|
| Sem Críticas | ✅ |
| Sem falhas P0 | ❌ (R-001…R-005) |
| Auth íntegra | ⚠ Mitigado em código; R-004 |
| RBAC íntegro | ✅ R-022 |
| Pagamentos protegidos | ⚠ Código mitiga; R-005 ops |
| Integrações seguras | ⚠ R-011…R-013 |
| LGPD escopo código | ⚠ R-014 |
| lint / type-check / acceptance | ✅ (acceptance = homologação) |

### Veredito

**NÃO APROVADO PARA PRODUÇÃO**  
**APROVADO PARA HOMOLOGAÇÃO**

Ver `security-report.md` para narrativa executiva.
