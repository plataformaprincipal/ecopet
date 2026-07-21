# Production Readiness

| Gate | Status | Evidência |
|------|--------|-----------|
| lint | APROVADO | `npm run lint` |
| type-check | APROVADO | database+web+api |
| build | APROVADO | `npm run build` exit 0 |
| migrations seguras | APROVADO COM RESSALVA | 27 up to date no DB configurado; backup Production NÃO EXECUTADO |
| Preview aprovado | NÃO EXECUTADO | |
| smoke Preview | NÃO EXECUTADO | |
| auth | APROVADO COM RESSALVA | unit + security parcial |
| RBAC | APROVADO | 43 unit + HTTP |
| banco íntegro | APROVADO COM RESSALVA | ready local; prod isolation não comprovada |
| integrações críticas | BLOQUEADO POR CREDENCIAL | MP none, TalkJS APP_ID, Better Stack |
| webhooks seguros | APROVADO (código) | MP/TalkJS unit; Live NÃO EXECUTADO |
| vulnerabilidades Critical | APROVADO | 0 critical omit=dev |
| vulnerabilidades High | APROVADO COM RESSALVA | 2 high residuais — aceite formal ou bump |
| P0 abertos | APROVADO COM RESSALVA | boot harness corrigido; deploy pendente |
| P1 abertos | REPROVADO (bloqueiam go-live pleno) | Live integrations |
| observabilidade ativa | BLOQUEADO POR CREDENCIAL | Better Stack MISSING |
| rollback documentado | APROVADO | `rollback-plan.md` |
| backup confirmado | NÃO EXECUTADO | |

**Pronto para deploy Preview** após login Vercel + env Preview.  
**Não pronto para Production plena** sem fechar P1 e smoke Preview.
