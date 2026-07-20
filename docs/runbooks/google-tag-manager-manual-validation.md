# Roteiro — Validação Manual GTM / GA4

Execute em **preview** ou staging antes de produção. Não substituível por CI.

## 1. Container & Preview

1. Confirmar `NEXT_PUBLIC_GTM_ID` na Vercel (Production / Preview).
2. Abrir o site com GTM Preview conectado.
3. Verificar que o container carrega (Tag Assistant / Preview).
4. Confirmar **ausência** de tags GA4 duplicadas no container (Estratégia B: hits via gtag).

## 2. Consent Mode v2

1. Limpar localStorage (`ecopet.analytics.consent.*`).
2. Abrir home — banner visível; analytics denied.
3. Aceitar analytics — `gtag('consent','update')` + espelho GTM.
4. Negar / só essenciais — EcoPet continua funcional; sem hits analytics.
5. Revogar via conta (se autenticado) e revalidar.

## 3. GA4 DebugView

1. `NEXT_PUBLIC_GA_DEBUG=1` em preview (ou extensão DebugView).
2. page_view único por rota (SPA).
3. login / sign_up / add_to_cart / begin_checkout.
4. **purchase** após pagamento aprovado — **uma vez**.
5. Reload da página de sucesso — **sem segundo purchase**.

## 4. Fluxos EcoPet

| Fluxo | O que observar |
|-------|----------------|
| Marketplace / carrinho / checkout / MP | purchase + status pagamento |
| Serviços / agenda | eventos de módulo |
| Meu Pet | eventos pet (sem PII) |
| Rede social / chat | sem conteúdo de mensagem no Data Layer |
| Maps | sem lat/long exata em analytics |
| Parceiros / ONG | eventos de aprovação só pós-confirmação |
| Admin / Admin Interno | painéis Produção GTM + Governança |

## 5. Segurança / LGPD spot-check

1. Network tab: payloads sem CPF/e-mail/token.
2. CSP sem bloqueio de `googletagmanager.com` / `google-analytics.com`.
3. Container ID mascarado no admin.

## 6. Performance / SEO

1. Lighthouse staging (Performance, A11y, Best Practices, SEO).
2. robots.txt / sitemap / OG ok (já auditados no código).

## 7. Assinatura

| Item | Responsável | Data | OK |
|------|-------------|------|----|
| Preview GTM | | | ☐ |
| DebugView | | | ☐ |
| Purchase 1× | | | ☐ |
| Consent | | | ☐ |
| Lighthouse | | | ☐ |
| Produção GTM painel | | | ☐ |
