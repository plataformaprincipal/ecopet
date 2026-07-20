# Responses API (Enterprise)

## Gateway

`apps/web/src/lib/ai/enterprise/openai-gateway.ts`

- `enterpriseGenerate` — Responses API preferencial (+ tools), fallback Chat Completions
- `enterpriseStream` — stream Responses quando disponível, senão Completions

## Integração

- Assistente: `streamAssistantChat` usa `enterpriseStream`
- Provider legado: `OpenAIProvider.streamResponse` delega ao gateway
- Não espalhar `client.responses` / `chat.completions` em features de negócio

## Modelos

`resolveEnterpriseModel(purpose)` — Strategy Pattern (`chat` | `tools` | `embed` | `fallback`).
