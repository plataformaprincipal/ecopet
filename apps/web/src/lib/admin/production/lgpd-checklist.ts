import type { ProductionCheckItem } from "./types";

/** Checklist LGPD operacional (auditoria estática + links). */
export function getLgpdChecklist(): ProductionCheckItem[] {
  return [
    {
      id: "lgpd-consent-default-denied",
      area: "LGPD",
      title: "Consent Mode v2 default denied",
      status: "PASS",
      detail: "analytics_storage / ad_* iniciam denied até grant do usuário.",
      href: "/legal/cookies",
    },
    {
      id: "lgpd-consent-banner",
      area: "LGPD",
      title: "Banner de consentimento",
      status: "PASS",
      detail: "UI reutilizável ConsentBanner + ponte CMP (applyExternalCmpConsent).",
    },
    {
      id: "lgpd-analytics-sanitize",
      area: "LGPD",
      title: "Sanitização de eventos GA",
      status: "PASS",
      detail: "Bloqueia CPF, RG, telefone, senha, JWT, tokens, endereço, cartões, dados médicos/financeiros.",
    },
    {
      id: "lgpd-gtm-sanitize",
      area: "LGPD",
      title: "Sanitização Data Layer / GTM",
      status: "PASS",
      detail:
        "event-sanitizer remove PII, prompts IA, chat e payloads proibidos antes do dataLayer.push.",
      href: "/admin/producao/google-tag-manager",
    },
    {
      id: "lgpd-no-datalayer-warehouse",
      area: "LGPD",
      title: "Sem warehouse de Data Layer",
      status: "PASS",
      detail: "Backend não persiste eventos comuns do navegador — só ops/dedupe hash.",
    },
    {
      id: "lgpd-privacy-pages",
      area: "LGPD",
      title: "Políticas públicas",
      status: "PASS",
      detail: "Páginas legais de privacidade/cookies disponíveis.",
      href: "/legal/cookies",
    },
    {
      id: "lgpd-revoke-api",
      area: "LGPD",
      title: "Revogação de consentimento",
      status: "PASS",
      detail: "API de conta + revokeAnalyticsConsent no cliente.",
      href: "/api/account/revoke-consent",
    },
    {
      id: "lgpd-dpo-process",
      area: "LGPD",
      title: "Processo DPO / pedidos de titular",
      status: "MANUAL",
      detail: "Validar fluxo operacional de direitos do titular em produção.",
      href: "/dashboard/admin/privacy-requests",
    },
    {
      id: "lgpd-retention",
      area: "LGPD",
      title: "Política de retenção",
      status: "MANUAL",
      detail: "Confirmar retenção de logs/audit e exclusão sob demanda.",
    },
  ];
}
