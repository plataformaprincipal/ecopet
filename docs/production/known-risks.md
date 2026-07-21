# Riscos conhecidos

| Risco | Severidade | Mitigação |
|---|---|---|
| Dual cart (Zustand client + server) | Alta UX/preço | Preferir API `/api/cart`; unificar |
| Webhooks Stripe/Pagarme fracos | Alta se ativados | Desabilitar ou HMAC real |
| Turnstile fail-open sem keys | Alta | Exigir keys em prod |
| CSP unsafe-inline/eval | Média | Manter allowlist mínima |
| Restore DB não comprovado | Alta operacional | Testar em staging |
| TalkJS/MP ainda Test/Sandbox | Bloqueio prod | Credenciais Live |
| Carga 1k usuários não medida | Média | Teste de carga em homologação |
| Enumeração login (histórico) | Baixa | Mensagem unificada aplicada |
