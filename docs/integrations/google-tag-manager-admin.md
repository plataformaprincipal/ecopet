# Google Tag Manager — Admin Interno

Rota: `/admin/integracoes/google-tag-manager`

## Seções

Visão Geral, **Backend**, Data Layer, Tags, Triggers, Variables, Consentimento, BI, Módulos, Health, Diagnóstico, Logs, Ambientes, Debug, Exportações, Alertas.

## Backend (novo)

Ações no painel (ADMIN):

- Status → `GET /api/admin/gtm/status`
- Health → `GET /api/admin/gtm/health?persist=1`
- Config → `GET /api/admin/gtm/config`
- Teste → `POST /api/admin/gtm/test`
- Limpar cache → `DELETE /api/admin/gtm/cache`

Catálogo paginado e auditoria via APIs (`/events`, `/audit`) — sem dados fictícios.

## Regras de UI

- Container ID sempre mascarado
- Estados vazios: “Sem dados” / “Ainda não validado”
- Não afirmar “container publicado” só porque a env existe
- Estratégia B: GA4 via gtag; GTM recebe espelhos namespaced

## Permissões

Papel do projeto: `ADMIN` (`requireAdmin`). Não há papéis SUPER_ADMIN/TI separados neste monorepo.
