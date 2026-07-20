# Storage — EcoPet

## Decisão arquitetural

| Camada | Tecnologia | Status |
|--------|------------|--------|
| Uploads de mídia | **Cloudinary** | Implementado |
| Supabase Storage | Env + registry | **Não implementado** (stub lança erro) |
| Fallback local | `local_dev` | Apenas desenvolvimento |

Evidência: `apps/web/src/lib/upload/service.ts` — ramo Supabase: *"Supabase Storage ainda não implementado."*

## Cloudinary

- Docs: `docs/integrations/cloudinary.md`
- Segurança upload: `docs/security/upload-security.md`
- Env: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

## Supabase Storage (futuro)

Variáveis opcionais (não usar em produção até implementar):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`

Quando implementar:

1. SDK oficial ou signed upload
2. Policies de bucket (public vs private)
3. Antivírus / tipo MIME / tamanho
4. Não expor `SERVICE_ROLE` no client
5. Migrar paths órfãos conscientemente

## Buckets / Policies

**No código Prisma/migrations:** não há definição de buckets Supabase.

**Dashboard:** não auditável via Git — confirmar manualmente se buckets vazios/orfãos existem.

## Arquivos órfãos

Metadados em `UploadAsset` (Prisma). Limpeza de blobs Cloudinary vs DB é processo operacional separado — não automatizado nesta auditoria.
