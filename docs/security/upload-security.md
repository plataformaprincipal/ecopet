# Upload Security — EcoPet

## Fluxo

`POST /api/upload` → `lib/upload/service.ts` → Cloudinary | Supabase | local dev

## Validações

- Autenticação obrigatória (`requireAuth`)
- Purpose whitelist (`social_post_media`, `pet_photo`, etc.)
- MIME e tamanho por purpose (`lib/upload/cloudinary.ts`)
- Nome de arquivo sanitizado
- Path traversal bloqueado em `local-dev.ts`

## Produção

Sem `CLOUDINARY_*` ou `SUPABASE_*` → `UPLOAD_NOT_CONFIGURED` (não grava local)

## DEV_ONLY

`UPLOAD_DEV_FALLBACK=1` + `public/uploads/dev` — **ignorado pelo Git**

## Documentos sensíveis

Documentos de pet/parceiro não devem ter URL pública permanente sem autenticação.

## Testes

`test:foundation:integrations` — upload auth 401, bloqueio prod
