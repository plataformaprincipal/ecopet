# Centro de Inteligência Analítica (Admin BI)

Hub em `/admin/bi` — métricas first-party (PostgreSQL) + Google Analytics 4 Data API (opcional).

## Domínios

| Rota | Conteúdo |
|------|----------|
| `/admin/bi` | Dashboard executivo |
| `/admin/bi/google-analytics` | Realtime, sessões, UTM, dispositivos, países |
| `/admin/bi/marketplace` | Receita, produtos, carrinhos, avaliações |
| `/admin/bi/social` | Posts, likes, comments, shares |
| `/admin/bi/parceiros` | Ranking e receita |
| `/admin/bi/ongs` | Animais e adoções |
| `/admin/bi/servicos` | Agendamentos |
| `/admin/bi/usuarios` | Cadastros e retenção proxy |
| `/admin/bi/financeiro` | Receita / ticket |
| `/admin/bi/performance` | Atividade operacional |
| `/admin/bi/conversoes` | Funil |
| `/admin/bi/alertas` | Anomalias |
| `/admin/bi/exportacoes` | Endpoints de export |

## APIs

- `GET /api/admin/bi/:domain?period=30d&city=&state=`
- `GET /api/admin/bi/export?domain=executive&format=csv|excel|json|pdf`

Acesso: `UserRole.ADMIN` only.

## GA4 Data API (inbound)

Além do tracking client (`NEXT_PUBLIC_GA_MEASUREMENT_ID`):

```bash
GA4_PROPERTY_ID=123456789
GA4_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
GA4_DATA_API_ENABLED=true
```

A service account precisa de acesso **Viewer** à propriedade GA4. O EcoPet **não** persiste o warehouse do Google.

## Banco

Sem tabelas novas — agrega Orders, Users, Social*, Appointments, AdoptionRequest, etc.

## Relação com telas existentes

- `/admin/analytics` — Analytics ERP (SystemMetric) mantido
- `/admin/integracoes/google-analytics` — diagnóstico de tracking/consent
- `/api/admin/erp/bi` — delega ao mesmo hub executivo
