# Smoke tests (mínimo)

Usuários de teste apenas.

1. `GET /api/health/live` → 200  
2. `GET /api/health/ready` → 200 (DB)  
3. Home carrega  
4. Cadastro + login CLIENT  
5. Meu Pet: criar pet  
6. Agenda: criar item  
7. Marketplace: add cart (API) + checkout sandbox se MP ok  
8. Mensagens: sessão TalkJS Test  
9. IA: mensagem curta se OpenAI ok  
10. Admin: dashboard + `/admin/observability` evento teste  
11. Better Stack: correlationId do teste  
12. Logout  

Não: pagamento alto valor; dados reais de clientes.
