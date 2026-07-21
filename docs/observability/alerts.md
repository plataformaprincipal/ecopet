# Alertas (passos manuais Better Stack)

Criar no painel (não automatizado nesta entrega):

1. App down / health live falhando
2. Taxa de erro elevada (`event=error.captured`)
3. Webhooks rejeitados (Mercado Pago / TalkJS)
4. Auth failures spike
5. OpenAI errors
6. Emails failed
7. Push failed
8. Job failures

Severidades: info / warning / error / critical. Use janela + cooldown para evitar alert fatigue.
