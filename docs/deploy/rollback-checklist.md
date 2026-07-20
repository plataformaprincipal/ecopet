# Checklist de Rollback — EcoPet

## Quando rollback

- Health `/api/health` falha após deploy
- Taxa de erro 5xx elevada no Vercel
- Checkout / auth quebrados
- Migration destrutiva (evitar; preferir forward-fix)

## Passos

1. **Vercel** → Deployments → promover deployment estável anterior (Instant Rollback).
2. Confirmar env vars inalteradas (não remover secrets no pânico).
3. Se migration nova for incompatível com código antigo:
   - Não rodar down cego em produção
   - Preferir hotfix forward ou restore de backup (Supabase PITR)
4. Validar: `/api/health`, login ADMIN, `/admin/producao`, checkout smoke.
5. Registrar incidente em AuditLog / canal ops.

## Não fazer

- `prisma migrate reset` em produção
- Force-push em `main` sem acordo
- Apagar variáveis Vercel “para testar”
