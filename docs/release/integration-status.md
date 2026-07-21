# Integration Status

| Integração | Preview | Production | Credencial local | Webhook | Logs | Segurança código | Status |
|------------|---------|------------|------------------|---------|------|------------------|--------|
| OpenAI | NÃO EXECUTADO | NÃO EXECUTADO | KEY SET; AI_ENABLED=false | N/A | redact | firewall unit 8/8 | BLOQUEADO POR CREDENCIAL (flag off) |
| Mercado Pago | NÃO EXECUTADO | NÃO EXECUTADO | token SET; provider **none** | assinatura unit | sanitize | fail-closed prod | BLOQUEADO POR CREDENCIAL |
| Firebase | NÃO EXECUTADO | NÃO EXECUTADO | public MISSING | N/A | sanitize | safe-url unit | BLOQUEADO POR CREDENCIAL |
| TalkJS | NÃO EXECUTADO | NÃO EXECUTADO | secret SET; APP_ID **MISSING** | HMAC unit | health sanitizado | persona rules | BLOQUEADO POR CREDENCIAL |
| Cloudinary | NÃO EXECUTADO | NÃO EXECUTADO | SET | N/A | — | upload constraints | APROVADO COM RESSALVA (sem smoke upload Live) |
| Resend | NÃO EXECUTADO | NÃO EXECUTADO | SET | N/A | — | server-only | APROVADO COM RESSALVA |
| Better Stack | NÃO EXECUTADO | NÃO EXECUTADO | **MISSING** | N/A | redaction unit | fail-soft | BLOQUEADO POR CREDENCIAL |
| Google Maps | NÃO EXECUTADO | NÃO EXECUTADO | public SET | N/A | — | unit | APROVADO COM RESSALVA |
| GA / GTM | NÃO EXECUTADO | NÃO EXECUTADO | IDs SET | N/A | sanitize | consent Mode | APROVADO COM RESSALVA |
| Turnstile | NÃO EXECUTADO | NÃO EXECUTADO | SET | N/A | — | verify unit 19/19 | APROVADO COM RESSALVA (hostname prod) |
