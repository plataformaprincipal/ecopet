# Prompt Firewall

`runPromptFirewall(text)` detecta e age sobre:

- Prompt injection / indirect injection
- Jailbreak
- Prompt leakage
- Data exfiltration
- Tool abuse
- Inputs sensíveis (sanitização)

Decisões: `ALLOW` | `SANITIZE` | `BLOCK`.

Eventos persistidos em `AISecurityEvent` quando não-ALLOW.
