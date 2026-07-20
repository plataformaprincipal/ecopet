# Segurança — Banco / Supabase / Prisma

## Modelo de ameaça

A aplicação conecta-se ao Postgres com **credencial de serviço** (pooler). Isso **bypassa RLS** mesmo se policies existirem no Dashboard.

Controles principais:

1. Secrets só no servidor (Vercel / `.env` gitignored)
2. `requireAuth` / `requireAdmin` nas APIs
3. Prisma parametrizado (mitiga SQL injection)
4. Rate limiting
5. Sanitização de logs (sem senha na connection string nos diagnostics)

## OWASP (foco dados)

| Risco | Mitigação EcoPet | Pendência |
|-------|------------------|-----------|
| Broken Access Control | Guards + RBAC | Revisar rotas novas |
| Injection | Prisma | Evitar `$queryRaw` com concat |
| Sensitive Data Exposure | Diagnostics só host | Rotacionar senha se vazamento |
| Security Misconfiguration | Sem `db push` prod | Alinhar preview DB ≠ prod |
| Logging | Boot diagnostics sem password | Não logar `DATABASE_URL` completa |
| CSRF / XSS | Cookies SameSite + CSP | Contínuo |

## Secrets

| Variável | Público? |
|----------|----------|
| `DATABASE_URL` / `DIRECT_URL` | **Nunca** |
| `SUPABASE_SERVICE_ROLE_KEY` | **Nunca** (se usado) |
| `SUPABASE_ANON_KEY` | Só se client real (hoje não) |
| `AUTH_SECRET` | **Nunca** |
| `NEXT_PUBLIC_*` | Público por definição |

**Higiene:** arquivos `.env` locais devem permanecer fora do Git. Se uma senha de banco aparecer em chat, ticket ou log, **rotacionar no Supabase** e atualizar Vercel.

## RLS

Migrations Prisma: **sem policies**.  
Se no futuro o PostgREST/Supabase client for usado, RLS torna-se obrigatório — até lá, não assumir proteção RLS.

## Performance / abuso

- Pooler + `connection_limit=1` em serverless
- Monitorar conexões / locks no Dashboard
- Índices densos no schema (~342 `@@index`) — evitar índices novos sem necessidade

## Monitoramento (checklist Dashboard)

- [ ] CPU / RAM
- [ ] Conexões ativas vs limite
- [ ] Queries lentas
- [ ] Locks
- [ ] Disk / Storage
- [ ] Bandwidth egress
