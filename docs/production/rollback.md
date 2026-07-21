# Rollback

1. Vercel → Promote deployment anterior
2. Feature flags off (`AI_ENABLED`, `MERCADO_PAGO_ENVIRONMENT=test`, `MSG_FLAG_*`)
3. Migration rollback só com plano + backup (Prisma não faz down automático seguro)
4. Validar `/api/health/live` + `/ready`
5. Verificar Better Stack por erros pós-rollback
