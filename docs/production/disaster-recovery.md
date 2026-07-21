# Disaster recovery

1. Detectar (Better Stack uptime / health)
2. Comunicar status page (se houver)
3. Restaurar DB a partir de backup Supabase
4. Redeploy último release estável Vercel
5. Feature flags: desligar IA/pagamentos/mensagens se necessário
6. Smoke test pós-restore
7. Postmortem

RTO/RPO: definir com operação (não inventados aqui).
