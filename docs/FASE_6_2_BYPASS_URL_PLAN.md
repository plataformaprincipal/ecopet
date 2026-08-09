# FASE 6.2 — Bypass URL (homolog only)

## Estado atual

Preview (`homolog.eccopet.com`) usa **Vercel Deployment Protection**.  
O webhook Mercado Pago de homologação inclui `x-vercel-protection-bypass` (query/header) para a notificação chegar na app.

Isso é **artefato exclusivo de homologação**.

## Production — plano obrigatório

| Regra | Ação |
| ----- | ---- |
| Sem bypass na URL | Webhook Production = `https://www.eccopet.com/api/webhooks/mercado-pago` (ou canônico sem query de bypass) |
| Autenticação | Somente `x-signature` + `x-request-id` + `data.id` (HMAC) |
| Deployment Protection | Domínio Production público para path de webhook **ou** Protection desabilitada no alias prod; **nunca** embedar bypass secret na URL cadastrada no MP |
| Rotação | Se bypass Preview vazar → rotacionar Automation Bypass Secret; não reutilizar em Production |

## Não fazer

- Copiar URL de homolog (com bypass) para o painel MP Production.  
- Logar o valor do bypass.  
- Desativar validação de assinatura para “facilitar” entrega.
