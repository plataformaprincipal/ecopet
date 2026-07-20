# Runbook — GTM Troubleshooting

## Sintomas → ações

| Sintoma | Verificar |
|---------|-----------|
| Painel “não configurado” | `NEXT_PUBLIC_GTM_ID` na Vercel + redeploy |
| Formato inválido | Regex `GTM-[A-Z0-9]{4,12}` |
| Health degraded | `/api/admin/gtm/health` — DB / dedupe / coleta pausada |
| Purchase duplicado no GA4 | Claim server + sessionStorage; tags GA4 no GTM (Estratégia B) |
| Teste 403 em production | `allowProductionTest` via PATCH config |
| 429 | Rate limit admin — aguardar janela |
| Cache stale | DELETE `/api/admin/gtm/cache` |

## Validação manual (obrigatória)

1. GTM Preview no ambiente correto
2. GA4 DebugView
3. Compra teste: um único `purchase`
4. Reload pós-compra: sem segundo `purchase`

## O que não fazer

- Afirmar “conectado ao GTM API” sem OAuth/credenciais
- Ligar Measurement Protocol ad hoc
- Gravar Data Layer no Postgres
