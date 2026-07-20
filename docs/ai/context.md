# Context Builder

`buildBusinessContext` monta o contexto de cada turno:

- Persona (CLIENT / PARTNER / ONG / ADMIN)
- Idioma ativo
- Página atual (`pagePath`) e módulo detectado
- Memória ativa (resumo + janela curta)
- Resultados de ferramentas read-only
- Bloco mínimo legado (`buildMinimalContext`)
- Stub RAG (desligado por padrão)

## Entrada

```ts
buildBusinessContext({
  userId, role, persona, locale, message,
  pagePath?, module?, petId?, conversationId?, displayName?
})
```

## Saída

`systemPrompt`, `contextBlock`, `toolsUsed`, `memorySummary`, `estimatedTokens`, `disclaimer`.
