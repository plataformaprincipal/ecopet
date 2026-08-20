# Feature freeze — go-live EccoPet

**DEFINITIVE** após Google Auth + hardening de integrações.

A partir deste documento, **nenhuma feature nova** entra antes do go-live.

Somente:

- BLOCKER
- SECURITY
- PAYMENT / DATABASE / PROVIDER FAILURE
- REGRESSION
- GO-LIVE CONFIG

Google Auth = última feature pré-launch.

Facebook Auth = **REMOVED**.
Apple Auth = **REMOVED**.

Não redesenhar Cliente, Parceiro, ONG, Admin, Marketplace, Services, Social, AI, Rewards ou Pricing.

Split Mercado Pago: ver `docs/finance/PAYMENT_TOPOLOGY.md`. `splitReady` só vira true com evidência de PSP, nunca por cálculo local.

## Classificação de pendências

### BLOCKER

- Split PSP Mercado Pago ainda **não** está operacional (`SPLIT_REQUIRES_MP_ENABLEMENT`).
  Comercialmente o checkout 1:1 funciona com collector da plataforma; o **repasse automático ao seller** depende de conta marketplace + OAuth do vendedor + produto MP compatível.
- Production: backup comprovado + `migrate deploy` (pricing + `PartnerMpConnection` + `ExternalAuthAccount`) + seed `BR-2026.08-v1` ACTIVE — **não executar nesta missão**.
- Google Cloud: cadastrar Authorized Redirect URI `https://www.eccopet.com/api/auth/google/callback` (código pronto; smoke real = EXTERNAL_ACTION_REQUIRED).

### IMPORTANT

- Restaurar backup em homologação e documentar evidência (`docs/production/backups.md`).
- `MERCADO_PAGO_CLIENT_ID` / `CLIENT_SECRET` no servidor (sandbox primeiro) para OAuth do vendedor.
- Confirmar Resend (`RESEND_API_KEY` + `EMAIL_FROM`) no ambiente Production.
- Relatório de settlement do Mercado Pago (importer) quando a conta marketplace existir — não fabricar números.

### POST-LAUNCH

- Checkout multi-seller (1:N) — a topologia atual é 1:1 de propósito (`MULTI_PARTNER_CART`).
- Transferência automática D+14 / D+7 via API de money-out (hoje: elegibilidade/planejamento; payout sandbox ≠ PSP).
- Reserva 1,5% como hold real no PSP (hoje: `riskReserveEstimate` de planejamento).

### FUTURE

- Marketplace fee nativo no produto Orders quando o MP habilitar collector do seller.
- Relatórios oficiais de settlement/report MP como fonte de conciliação automática contínua.
