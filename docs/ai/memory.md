# Memória do Assistente

## Camadas

| Camada | Onde | Função |
|--------|------|--------|
| Curta | `AiSession.messages.history` (≤20) | Turnos recentes |
| Ativa | `loadActiveConversationMemory` | Janela deslizante + perguntas recentes |
| Longa / resumo | `AIConversation.summary` + `preferences.__summary` | Resumo extrativo incremental |
| Limpeza | `cleanupStaleAiSessions` | Remove sessões AI > 90 dias |

## Resumo

`buildExtractiveSummary` / `updateConversationSummary` — sem LLM extra (custo/latência).
Não duplica histórico (stream chama `saveMemory`; summary só atualiza campos de resumo).
