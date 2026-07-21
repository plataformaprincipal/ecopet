# Migrations

```bash
npm run db:migrate:deploy   # produção / CI
npm run db:migrate          # dev
```

- Não apagar migrations antigas
- Não `db push` em produção
- Backup antes de migrate deploy
- Validar drift em homologação antes de production
