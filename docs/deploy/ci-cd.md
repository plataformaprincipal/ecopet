# CI/CD — EcoPet

## Workflow

`.github/workflows/ci.yml`

### Jobs

1. Postgres 16 service container
2. `npm ci`
3. `npm run db:generate`
4. `npm run db:migrate:deploy`
5. `npm run type-check`
6. `npm run lint`
7. `npm run build`
8. `npm run start` + testes foundation (auth, gestor) + security

## Secrets no CI

Nenhum secret de produção necessário. Secrets de teste definidos inline no workflow.

## E2E

Opcional no CI (Playwright requer browsers). Executar localmente:

```bash
npm run test:e2e
npm run test:e2e:headed
```

## Local — suite completa

```bash
npm run test:foundation:all
npm run test:security
```
