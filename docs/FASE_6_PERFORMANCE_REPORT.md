# FASE 6 — Performance report

## Produção / piloto

Sem RUM piloto. Domínio `www.eccopet.com` responde 200 (smoke superficial).

## Homolog (qualitativo)

| Sinal | Nota |
| ----- | ---- |
| Webhook natural latency | ~2–4s delivery MP→app |
| Charge sandbox | segundos |
| API p95 / LCP / INP / CLS | **não medidos** nesta fase |
| DB | pooler Supabase sa-east-1; ping OK intermitente |

## Ação

Instrumentar Web Vitals + API timings **antes** de qualquer growth.  
Não adicionar índices sem query evidence.
