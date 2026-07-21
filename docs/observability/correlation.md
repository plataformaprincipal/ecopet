# Correlation ID

Header: `x-correlation-id`

- Aceito se válido (UUID-like / tamanho limitado)
- Gerado se ausente
- Propagado em logs, erros e resposta (`x-correlation-id`)
- Exibido ao suporte em erros internos

Implementação: `context.ts` + `redaction.ts` (`newCorrelationId`, `isValidCorrelationId`).
