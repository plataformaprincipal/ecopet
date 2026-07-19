# Checklist — pagamentos reais (produção)

## Antes do go-live

- [ ] `MERCADO_PAGO_ACCESS_TOKEN` de produção (não TEST-)
- [ ] `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY` de produção
- [ ] `MERCADO_PAGO_ENVIRONMENT=production`
- [ ] `MERCADO_PAGO_WEBHOOK_SECRET` configurado e obrigatório
- [ ] Webhook URL: `https://SEU-DOMINIO/api/webhooks/mercado-pago`
- [ ] Migration `PaymentRefund` / campos Payment aplicada
- [ ] Admin sincronizou meios: `POST /api/admin/financeiro/metodos` action=sync
- [ ] Meios desejados habilitados (só se `supportedByAccount`)

## Teste real controlado (manual — não automatizar cobrança)

1. Produto de baixo valor  
2. Cartão real aprovado → pedido PAID + estoque baixado uma vez  
3. Pix real → QR → pagamento → webhook → PAID  
4. Boleto (se habilitado) → pendente até compensação  
5. Estorno parcial admin → saldo reembolsável correto  
6. Estorno do restante → REFUNDED  
7. Conferir saldo no painel Mercado Pago  
8. Conciliação admin sem divergência crítica  
9. Notificações cliente/parceiro  

**Não** usar cartão do mesmo titular vendedor se a regra do MP proibir.

## Não marcar “ativo em produção” só porque o código existe

Exige: credenciais prod + deploy + método na conta + teste real + webhook + saldo + conciliação.
