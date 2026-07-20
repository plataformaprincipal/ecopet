# Centro de Governança GTM — Admin Interno

Rota: `/admin/integracoes/google-tag-manager`

## APIs (ADMIN)

| Método | Path | Uso |
|--------|------|-----|
| GET | `/api/admin/gtm/governance` | Relatório completo (`?persist=1&fresh=1`) |
| GET | `/api/admin/gtm/export?format=` | json \| csv \| excel \| pdf |
| POST | `/api/admin/gtm/datalayer-sample` | Amostra sanitizada (ring ≤50) |
| GET | `/api/admin/integrations/google-tag-manager/diagnostics` | Diagnóstico legado |

## Fonte de dados

- **Não** sincroniza a API Google Tag Manager (tags live).
- Inventário Tags/Triggers/Variables = **governança recomendada EcoPet**.
- BI estrutural = catálogo de eventos.
- Volumes geo/device → `/admin/bi/google-analytics`.
- Ops state reutiliza `AnalyticsOpsState` com `provider=google_tag_manager`.

## Permissões

`UserRole.ADMIN` (Admin Interno). Não há papéis SUPER/TI separados no schema atual.

## Preview GTM

Validação live do container continua no **GTM Preview** (browser).
