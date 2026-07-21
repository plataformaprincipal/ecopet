# Redaction / privacidade

Proibido em telemetria: senhas, tokens, JWT, cookies, Authorization, API keys, DATABASE_URL, cartão, CVV, Pix, CPF completo, prontuário, mensagens privadas, prompts OpenAI completos, payloads webhook integrais.

Implementação: `redactForObservability` + `sanitizeErrorMessage` + hash de userId.

LGPD: base técnica de minimização — não substitui parecer jurídico.
