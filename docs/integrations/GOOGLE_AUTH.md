# Google Auth — EccoPet

Único login social do lançamento. Facebook Auth e Apple Auth foram **REMOVED**.

## Arquitetura

Google OIDC (Authorization Code + PKCE + state + nonce) termina na **mesma sessão** EccoPet:

cookie `ecopet-session` (JWT HS256) — não NextAuth, não Express.

Rotas:

- início: `GET /api/auth/google?intent=login|register|link&returnTo=/path`
- callback: `GET /api/auth/google/callback`
- onboarding: `GET|POST /api/auth/google/complete`
- métodos: `GET|DELETE /api/auth/methods`

## Variáveis

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Somente servidor. Nunca `NEXT_PUBLIC_GOOGLE_CLIENT_SECRET`.

## Google Cloud — configuração obrigatória

Authorized JavaScript origins:

- `https://www.eccopet.com`
- `http://localhost:3000` (dev)

Authorized redirect URIs:

- `https://www.eccopet.com/api/auth/google/callback`
- `http://localhost:3000/api/auth/google/callback`

Homologação, se usada: `https://homolog.eccopet.com/api/auth/google/callback`

Até o URI de produção existir no Google Cloud, o status operacional é **EXTERNAL_CONFIG_REQUIRED**. Código completo ≠ smoke real.

## Account linking

Não vincula automaticamente por e-mail. Conta com senha + mesmo e-mail Google → usuário entra com senha e conecta Google em Segurança.

Novo usuário Google → `/cadastro/google` (termos + privacidade + persona CLIENT|PARTNER|ONG). Google nunca cria ADMIN.

Partner/ONG novos ficam `PENDING` (homologação EccoPet).

## Unlink

Não desconecta Google se for o único método. Exige senha antes.

## Testes

```
npm run test:google-auth -w @ecopet/web
```

E2E interno: `e2e/google-auth.spec.ts` (não clica no Google real).
