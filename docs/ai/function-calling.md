# Function Calling (Enterprise)

## Estado

| Capacidade | Status |
|------------|--------|
| Schemas OpenAI | Pronto |
| Validação / permissões | Pronto |
| Executor (services) | Pronto |
| Loop Responses/Completions | **Operacional** (`runFunctionCallingLoop`) |
| Execution log (`AIToolExecution`) | Pronto |
| MCP | Não |

## Fluxo no assistente

1. Intent router (Prompt 3) enriquece contexto
2. `runFunctionCallingLoop` chama modelo com tools
3. Executa `handleFunctionCall` → services
4. Loga em `AIToolExecution`
5. Stream final via Responses API

## Arquivos

- `modules/tool-registry.ts`, `tool-executor.ts`, `function-calling.ts`
- `enterprise/tool-loop.ts`, `tool-execution-log.ts`, `openai-gateway.ts`
