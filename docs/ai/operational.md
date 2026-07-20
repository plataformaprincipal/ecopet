# EcoPet IA — Camada Operacional

Extensão transversal sobre foundation/assistant/modules/enterprise. **Não** é um segundo chatbot.

## Escopo entregue

| Capacidade | Status | Evidência |
|---|---|---|
| Feature flags `AI_FLAG_*` | Concluído | `lib/ai/operational/feature-flags.ts` |
| Orquestrador por perfil/página | Concluído | `agent-orchestrator.ts` + stream |
| Automações por evento | Concluído com ressalvas | registry + executor (AIJob + in-app) |
| Previsões explicáveis | Concluído com ressalvas | scoring + `AIRecommendation` |
| Marketplace NL → filtros | Concluído | `POST /api/ai/marketplace/search` |
| Explorar por mensagem | Concluído com ressalvas | `POST /api/ai/explore` |
| Meu Pet IA (seguro) | Concluído | `GET /api/ai/mypet/summary` |
| Ações com confirmação | Concluído com ressalvas | `POST /api/ai/actions` |
| Admin operacional | Concluído | `/admin/ai/operational` |

## Flags (env)

- `AI_ENABLED=false` desliga tudo
- `AI_FLAG_ASSISTANT`, `AI_FLAG_STREAMING`, `AI_FLAG_TOOLS`, `AI_FLAG_AUTOMATIONS`, …
- Valor `false` / `0` / `off` desliga; ausente = ligado (se IA global on)

## Endpoints

- `POST /api/ai/marketplace/search` `{ message }`
- `POST /api/ai/explore` `{ message }`
- `GET /api/ai/mypet/summary`
- `POST /api/ai/predictions`
- `POST /api/ai/actions` `{ tool, params, confirmed?, confirmationToken? }`
- `GET|POST /api/admin/ai/operational`

## Segurança

- Sem `NEXT_PUBLIC_OPENAI_*`
- Ferramentas de ação exigem confirmação
- Meu Pet não retorna prontuário integral
- Marketplace/Explore não inventam preço/estoque
- Automações: dedupe 24h; sem e-mail/push de teste automático em massa

## Pendências honestas

- E2E Playwright completo por perfil
- Redis/Upstash como rate-limit definitivo
- Filas Inngest/Trigger para todos os eventos de domínio
- Cards ONG/adoção/campanha além de deep links
- ERP financeiro autônomo (bloqueado por regra de negócio)
