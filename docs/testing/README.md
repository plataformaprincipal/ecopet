# EcoPet — Testing Hub

## Relatórios Enterprise QA (Prompt 3)

| Documento | Conteúdo |
|-----------|----------|
| [acceptance-report.md](./acceptance-report.md) | Aceitação por área/perfil + veredito |
| [qa-report.md](./qa-report.md) | Matriz módulo × status × prioridade |
| [bugs.md](./bugs.md) | Achados P0–P3 |
| [performance.md](./performance.md) | Perf / gaps Lighthouse |
| [responsive.md](./responsive.md) | Viewports e cross-browser |
| [production-checklist.md](./production-checklist.md) | Homolog → produção |

## Aceitação por perfil (detalhe anterior)

Ver pasta [`acceptance/`](./acceptance/) — roteiros visitor/client/partner/ngo/admin e integrações.

## Comandos principais

```bash
npm run test:e2e:acceptance
npm run test:permissions:unit
npm run test:i18n
npm run test:accessibility
npm run test:vlibras -w @ecopet/web
npm run test:mercado-pago -w @ecopet/web
npm run test:talkjs -w @ecopet/web
npm run test:observability -w @ecopet/web
node scripts/qa-env-audit.mjs
```

## Veredito atual

**✅ Pronto para Homologação** — não aprovado para produção.
