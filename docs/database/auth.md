# Auth — EcoPet (vs Supabase Auth)

## Conclusão

O EcoPet **não** usa Supabase Auth como provedor de sessão.

| Componente | Implementação |
|------------|---------------|
| Usuário | Prisma `User` + `passwordHash` (bcrypt) |
| Sessão | Cookie `ecopet-session` JWT (`jose` HS256) |
| Secret | `AUTH_SECRET` / fluxo documentado em auth-session |
| Reset senha | `PasswordResetToken` + e-mail |
| OAuth / NextAuth | Rota preparada — **não** é a sessão principal |
| Supabase Auth | Não integrado |

## Implicações de segurança

- Proteção de dados: **RBAC + guards na aplicação**, não RLS Supabase Auth
- Credencial Prisma no server = acesso amplo ao schema — proteger secrets Vercel
- Rate limit em login/reset (código existente)

## Templates / Magic Link / Providers

Não há templates Supabase Auth no repo. Magic link/OAuth Supabase: **não aplicável** ao fluxo atual.

## Checklist operacional

- [ ] `AUTH_SECRET` forte na Vercel Production
- [ ] Cookie `Secure` + `HttpOnly` + `SameSite` em HTTPS
- [ ] Rotação de secret implica logout em massa — comunicar
- [ ] Não confundir `SUPABASE_ANON_KEY` (ausente/não usado) com auth da app
