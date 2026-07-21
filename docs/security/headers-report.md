# Security Headers Report — EcoPet

**Data:** 2026-07-20  
**Fonte de verdade:** `apps/web/src/lib/security/headers.ts` + `next.config.ts`  
**CSP notes:** `docs/security/csp.md`

---

## 1. Headers aplicados

| Header | Valor / comportamento | Status |
|--------|----------------------|--------|
| `X-Content-Type-Options` | `nosniff` | ✅ |
| `X-Frame-Options` | `SAMEORIGIN` | ✅ |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | ✅ |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(self), payment=()` | ✅ |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` **somente** `NODE_ENV=production` | ✅ |
| `Content-Security-Policy` | Ver seção 2 | ⚠ Permissiva por dependências |

Cookies de sessão (não header HTTP genérico, mas superfície crítica):

| Atributo | Valor |
|----------|-------|
| Nome | `ecopet-session` |
| HttpOnly | true |
| SameSite | Lax |
| Secure | true em HTTPS / Vercel (force-insecure ignorado em prod) |

---

## 2. CSP — diretivas sensíveis

| Diretiva | Conteúdo relevante | Risco |
|----------|-------------------|-------|
| `default-src` | `'self'` | OK |
| `script-src` | `'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob:` + VLibras, TalkJS, Maps, GA, MP | **Médio** — enfraquece anti-XSS |
| `style-src` | `'unsafe-inline'` + fonts/VLibras | Médio-baixo |
| `img-src` | `https:` amplo + Cloudinary/Maps | Baixo-médio |
| `connect-src` | `https: wss:` + providers | **Médio** — amplo |
| `frame-src` | TalkJS, GTM, MP, VLibras | OK para integrações |
| `object-src` | `none` | ✅ |
| `frame-ancestors` | `'self'` | ✅ clickjacking |
| `base-uri` / `form-action` | `'self'` | ✅ |
| `upgrade-insecure-requests` | só produção | ✅ |

**Não remover** `unsafe-inline`/`unsafe-eval` sem QA VLibras + TalkJS (documentado em `csp.md`).

---

## 3. CORS

- App Next.js: mutações same-origin com cookie session.  
- API Express (se usada): `FRONTEND_URL` no env-registry para CORS.  
- Sem `Access-Control-Allow-Origin: *` com credentials no fluxo web principal auditado.

---

## 4. Validação dinâmica nesta rodada

Tentativa de inspecionar headers em `http://127.0.0.1:3002` falhou (HTTP 500 no servidor estável).  
**Reteste obrigatório em staging:**

```bash
curl -sI https://<preview-or-prod>/ | findstr /I "content-security strict-transport x-frame x-content permissions referrer"
```

Esperado em produção: todos os headers da seção 1 + HSTS + CSP completa.

---

## 5. Achados

| ID | Achado | Severidade | Correção | Status |
|----|--------|------------|----------|--------|
| HDR-01 | `script-src` com unsafe-inline/eval | Média | Nonces + sandbox VLibras | Aberto (aceito temporário) |
| HDR-02 | `connect-src https:` amplo | Média | Allowlist hosts | Aberto |
| HDR-03 | Prova curl headers local falhou (500) | Alta (evidência) | Estabilizar server + revalidar | Aberto |

---

## 6. Cookies / HTTPS produção

| Controle | Status |
|----------|--------|
| HTTPS Vercel | Obrigatório em deploy |
| HSTS preload-ready | Presente em prod build |
| Sem Secure em HTTP local | Esperado em dev |
| Secrets em `NEXT_PUBLIC_*` | Apenas chaves públicas (Maps, Turnstile site, GA/GTM, Firebase public) — secrets server-only |
