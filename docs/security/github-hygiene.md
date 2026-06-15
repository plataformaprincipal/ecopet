# Higiene do repositório GitHub — EcoPet

## Checklist

- [ ] `.env`, `.env.local`, `.env.production` **nunca** commitados
- [ ] `packages/database/.env` ignorado (gerado por `npm run sync:env`)
- [ ] `.ecopet/` (Postgres embedded + backups) ignorado
- [ ] `node_modules/`, `.next/`, `dist/`, `out/` ignorados
- [ ] `apps/web/public/uploads/dev` ignorado
- [ ] `*.sql`, `*.dump`, `*.pem`, `*.key` ignorados
- [ ] Apenas `.env.example` versionado (sem valores reais)
- [ ] Secrets rotacionados se algum vazamento histórico for detectado
- [ ] PRs revisados antes de merge em `main`
- [ ] CI (`/.github/workflows/ci.yml`) passando

## Arquivos sensíveis — nunca versionar

| Arquivo | Risco |
|---------|-------|
| `.env` | DATABASE_URL, AUTH_SECRET, SMTP_PASS, API keys |
| `.ecopet/pg-data` | Dados reais do banco local |
| `public/uploads/dev` | Uploads de usuários em dev |
| Dumps SQL | PII completa (CPF, e-mails, mensagens) |

## Se um secret foi commitado

1. Rotacionar imediatamente todas as credenciais expostas
2. Remover do histórico com `git filter-repo` ou suporte GitHub (não apenas `.gitignore`)
3. Registrar incidente no AuditLog interno
4. Notificar DPO se PII foi exposta

## Comandos de verificação

```bash
git status
git ls-files | findstr /i "\.env"
git check-ignore -v .ecopet/pg-data
```

## Estado Etapa 13

- `.gitignore` atualizado com padrões ampliados
- Templates `.env.example` mantidos sem secrets reais
- Nenhum `.env` deve aparecer em `git ls-files`
