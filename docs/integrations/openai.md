# OpenAI / EcoPet AI

## Finalidade
Chat, resumos, geração de texto, embeddings e moderação assistiva.

## Variáveis
```
AI_ENABLED=false
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_MODERATION_MODEL=omni-moderation-latest
OPENAI_MAX_OUTPUT_TOKENS=1024
OPENAI_REQUEST_TIMEOUT_MS=30000
OPENAI_DAILY_USER_LIMIT=50
OPENAI_MONTHLY_BUDGET_CENTS=500
```

## Sem chave
- Código: `AI_NOT_CONFIGURED` (HTTP 503)
- UI: banner “recursos de IA ainda não disponíveis”
- **Não** gera texto falso

## Ativação
1. Obter chave em https://platform.openai.com/
2. `AI_ENABLED=true` + `OPENAI_API_KEY=sk-...`
3. Reiniciar web
4. Admin → Integrações → Testar OpenAI
5. Abrir `/eccopet` e enviar mensagem

## Segurança
- Chave só no servidor
- Disclaimer veterinário obrigatório
- Rate limit + orçamento mensal

## Custo
Tokens por request; configure `OPENAI_MONTHLY_BUDGET_CENTS`.
