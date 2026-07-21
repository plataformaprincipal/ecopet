# Release Notes — Etapa 5 (Auditoria Final)

## Inclui (working tree + correções)

- UI Foundation + UI Premium (Etapas 1–2)
- Suites de aceitação e docs de QA (Etapa 3)
- Relatórios de segurança OWASP (Etapa 4)
- Observabilidade Better Stack (código)
- Health live/ready
- Correção boot `next start` + harness de testes estáveis
- Hardening deps (`ws`, `form-data`, next-auth patch)
- `apps/web/vercel.json` monorepo

## Não inclui nesta etapa

- Deploy Vercel Preview/Production
- Ativação Live Mercado Pago / TalkJS / Better Stack
- Novas features de produto
- Migrations novas

## Breaking / ops

- Em produção Vercel, flags `AUTH_TEST_*` / `FORCE_INSECURE_*` continuam **proibidas**
- `ECOPET_STABLE_TEST_SERVER` somente local
