# Cloudflare Turnstile — EcoPet

Integração anti-bot para formulários públicos e login progressivo.

## Arquitetura

```
apps/web/src/lib/turnstile/     # config, verify (server-only), actions, metrics
apps/web/src/components/security/  # widget / field / status
apps/web/src/hooks/use-turnstile.ts
```

- **Site Key** (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`): disponível no browser.
- **Secret Key** (`TURNSTILE_SECRET_KEY`): somente módulos com `import "server-only"`.
- Validação no endpoint oficial: `https://challenges.cloudflare.com/turnstile/v0/siteverify`.
- Métricas: modelo `SecurityVerificationEvent` (sem token em claro; hash SHA-256 opcional para anti-replay).

## Variáveis (somente nomes)

| Variável | Escopo |
|----------|--------|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Pública |
| `TURNSTILE_SECRET_KEY` | Servidor |
| `TURNSTILE_ENABLED` | `true` / `false` |
| `TURNSTILE_ALLOWED_HOSTNAMES` | CSV |
| `TURNSTILE_TIMEOUT_MS` | default `5000` |
| `TURNSTILE_PREVIEW_HOSTNAMES` | CSV opcional para previews |
| `TURNSTILE_DEV_BYPASS` | **somente development** |

Nunca versionar valores reais. Nunca logar a Secret Key.

## Widget

Componente `TurnstileField` / `TurnstileWidget` (`@marsidev/react-turnstile`):

- action por fluxo;
- reset após erro/expiração/submissão;
- token só em memória;
- i18n pt-BR / en / es;
- tema claro/escuro;
- acessível (rótulo + `aria-live` de status).

## Validação server-side

`verifyTurnstileToken` / `requireTurnstile`:

1. configuração / enabled;
2. token presente e formato;
3. `success` Cloudflare;
4. **action** esperada;
5. **hostname** permitido;
6. timestamp / expiração;
7. claim de hash (anti-replay interno);
8. timeout via `AbortController` (sem retry indiscriminado).

## Actions

| Action | Fluxo |
|--------|--------|
| `register_client` | Cadastro cliente |
| `register_partner` | Cadastro parceiro |
| `register_ngo` | Cadastro ONG |
| `password_recovery` | Recuperação de senha |
| `contact_form` | Contato público `/contato` |
| `login_risk` | Login progressivo |

O backend **não** aceita actions arbitrárias do cliente.

## Hostnames

Centralizados em `getTurnstileAllowedHostnames()`:

- produção: `eccopet.com`, `www.eccopet.com`, aliases `ecopet.com`, `APP_URL`, lista env — **sem localhost**;
- preview: `VERCEL_URL` + `TURNSTILE_PREVIEW_HOSTNAMES` / `TURNSTILE_ALLOWED_HOSTNAMES`;
- development: + `localhost` / `127.0.0.1`.

Não liberar `*.vercel.app` em produção só para facilitar preview.

## Política fail-closed / fail-open

- **Produção + Turnstile habilitado**: fail-closed nos fluxos críticos (cadastro, recuperação, contato).
- **Sem configuração**: não bloqueia deploy (fail-open de deploy); documentar risco.
- **`TURNSTILE_ENABLED=false`**: skip explícito.
- **`TURNSTILE_DEV_BYPASS=1`**: só development; em production → `BYPASS_FORBIDDEN`.

## Rate limiting

- Memória do processo (`checkAuthRateLimit`) + **`RateLimitBucket` no PostgreSQL** (`checkDistributedRateLimit`) para multi-instância Vercel.
- Turnstile **complementa** rate limit; não substitui.

## Login progressivo

Após ≥3 falhas em 15 min (IP ou identificador via `LoginLog`), API retorna `TURNSTILE_REQUIRED` e o frontend exibe o widget com action `login_risk`.

## Recuperação de senha

Turnstile validado **antes** de OTP/Resend. Resposta pública genérica; falha de Turnstile sem enumeração de contas.

## Acessibilidade e i18n

Chaves `turnstile.*` em `pt-BR.json`, `en.json`, `es.json`. Status textual; sem depender só de cor; não sobrepor VLibras.

## Métricas e admin

- Painel: `/admin/integracoes/turnstile` (alias `/admin/seguranca/bots`)
- Diagnóstico ADMIN: `GET /api/admin/integrations/turnstile/diagnostics`
- Nunca retorna Secret Key, token ou resposta bruta Cloudflare.

## Privacidade (LGPD) — nota técnica

Finalidade: prevenção a fraude/bots. Enviado ao Cloudflare: token do desafio + secret (servidor) + IP opcional se confiável. Internamente: métricas sanitizadas, hash de token com retenção curta, hash truncado de IP. **Texto jurídico público deve ser revisado por responsável legal antes de publicação em termos.**

## Rotação de chaves

1. Gerar novo par no Cloudflare Dashboard.
2. Atualizar Vercel (Production/Preview) e `.env` local.
3. Redeploy.
4. Confirmar diagnóstico admin `ACTIVE`.
5. Revogar chaves antigas no Cloudflare.

## Indisponibilidade Cloudflare

- Fluxos críticos falham fechado (mensagem genérica / 503).
- Emergência: `TURNSTILE_ENABLED=false` (risco elevado — monitorar rate limit).
- Registrar incidente; reativar assim que siteverify estabilizar.

## Testes

```bash
npm run test:turnstile -w @ecopet/web
```

Usar mocks nos testes; chaves oficiais de teste Cloudflare apenas em ambiente de teste, sem sobrescrever secrets reais do usuário.

## Checklist de implantação

- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` e `TURNSTILE_SECRET_KEY` na Vercel
- [ ] Hostnames do widget no Cloudflare Dashboard
- [ ] `TURNSTILE_ALLOWED_HOSTNAMES` alinhado ao domínio oficial
- [ ] Migration `SecurityVerificationEvent` / `RateLimitBucket` aplicada
- [ ] Cadastro cliente/parceiro/ONG exige widget quando habilitado
- [ ] Forgot-password não chama Resend sem token válido
- [ ] Login progressivo após falhas
- [ ] Admin diagnóstico sem Secret Key
- [ ] `npm run type-check` / `lint` / `test:turnstile` / `build`
