# Aceitação — índice

| Documento | Conteúdo |
|---|---|
| [matrix.md](./matrix.md) | Matriz perfil × módulo |
| [visitor.md](./visitor.md) | Roteiro VISITOR |
| [client.md](./client.md) | Roteiro CLIENT |
| [partner.md](./partner.md) | Roteiro PARTNER |
| [ngo.md](./ngo.md) | Roteiro NGO |
| [admin.md](./admin.md) | Roteiro ADMIN |
| [super-admin.md](./super-admin.md) | SUPER_ADMIN / TI |
| [integrations.md](./integrations.md) | Integrações |
| [payments.md](./payments.md) | Pagamentos |
| [security.md](./security.md) | Segurança |
| [accessibility.md](./accessibility.md) | A11y |
| [production-smoke.md](./production-smoke.md) | Smoke prod controlado |
| [final-acceptance-report.md](./final-acceptance-report.md) | Relatório final |

## Automação

```bash
# Requer app em WEB_URL (default http://localhost:3000)
npm run test:e2e:acceptance

# Limpeza (apenas @test.ecopet.local)
ACCEPTANCE_CLEANUP=1 node --import tsx scripts/acceptance-cleanup.mjs
```

Specs: `e2e/acceptance/*.spec.ts` · Helpers: `e2e/helpers/acceptance.ts`
