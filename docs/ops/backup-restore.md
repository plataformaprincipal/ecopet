# Backup e restore — EcoPet

## Backup local (desenvolvimento)

```bash
npm run db:backup:local
```

Salva em `.ecopet/backups/ecopet-backup-*.sql` — pasta ignorada pelo Git.

Requisito: `pg_dump` no PATH.

## Restore local

```bash
psql -h localhost -U ecopet -d ecopet -f .ecopet/backups/arquivo.sql
```

## Produção

Usar snapshots do provedor (Neon/Supabase). Agendar backup diário.

## Regras

- Nunca commitar `*.sql` ou dumps
- Criptografar backups com PII em repouso
- Testar restore em staging periodicamente
- Rotacionar backups > 30 dias conforme política LGPD
