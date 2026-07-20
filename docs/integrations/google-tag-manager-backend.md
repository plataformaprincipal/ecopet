# Google Tag Manager — Backend Ops

## Arquitetura

Camada server em `apps/web/src/lib/server/gtm/` para **configuração operacional**, health, diagnóstico, catálogo (definições), deduplicação transacional e auditoria admin.

**Não é** um clone do GTM. **Não** armazena o Data Layer. **Não** gerencia tags remotas.

```
Browser Data Layer → GTM container → GA4 (tags no container / Estratégia B)
                         ↑
Admin APIs (RBAC) ← server/gtm ← AnalyticsOpsState + AnalyticsTransactionalDedup
```

Eventos comuns (page_view, click, search) **não** passam pelo banco.

## Fonte de verdade do Container ID

- `NEXT_PUBLIC_GTM_ID` (env / Vercel)
- Painel **não** altera o ID
- Exibição sempre mascarada (`GTM-A***YZ`)

## Serviços

| Serviço | Função |
|---------|--------|
| `config-service` | Flags em `AnalyticsOpsState` (`provider=google_tag_manager`) |
| `status-service` | Status + health + diagnostics |
| `catalog-service` | Catálogo a partir do código (`listAllEventDefinitions`) |
| `deduplication-service` | Claim atômico em `AnalyticsTransactionalDedup` |
| `http` | `withGtmAdminRoute` (ADMIN + rate limit + audit) |

## Flags operacionais (painel)

- `collectionEnabled`
- `debugEnabled`
- `consentRequired`
- `diagnosticLevel` (`basic` \| `full`)
- `allowProductionTest`
- `eventContractVersion` (fixada pelo contrato)

## APIs

Prefixo: `/api/admin/gtm/*` — exige `UserRole.ADMIN`.

| Endpoint | Método |
|----------|--------|
| `/status` | GET |
| `/health?persist=1` | GET |
| `/diagnostics` | GET |
| `/config` | GET / PATCH |
| `/events` | GET |
| `/audit` | GET |
| `/test` | POST |
| `/cache` | DELETE |

Claim checkout (usuário autenticado):

- `POST /api/telemetry/transactional-claim`

## Limitações

- Sem API oficial GTM → sem sync live de tags/triggers
- Preview / DebugView = validação manual
- Cache em memória / governance cache: não confiável entre instâncias serverless
- Sem Measurement Protocol neste prompt
