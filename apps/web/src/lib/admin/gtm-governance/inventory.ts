import { GtmEvents } from "@/lib/gtm/events";
import type { GtmInventoryItem } from "./types";

/**
 * Inventário de governança EcoPet (esperado no container).
 * NÃO é sync live da API GTM — evita duplicar o warehouse/config do Google.
 */
export function getRecommendedTags(): GtmInventoryItem[] {
  return [
    {
      id: "tag-consent-init",
      name: "Consent Initialization — EcoPet defaults",
      type: "Consent Mode",
      status: "RECOMMENDED",
      detail: "Respeitar Consent Mode v2 (defaults denied via EcoPet).",
    },
    {
      id: "tag-ga4-disabled-note",
      name: "GA4 Config (DESATIVAR se gtag EcoPet ativo)",
      type: "GA4 Configuration",
      status: "WARN",
      detail: "Não publicar GA4 Config/page_view no GTM se o provider EcoPet já envia.",
    },
    {
      id: "tag-ads-optional",
      name: "Google Ads / Remarketing (opcional)",
      type: "Advertising",
      status: "OPTIONAL",
      detail: "Disparar só com ad_storage granted.",
    },
    {
      id: "tag-custom-html-guard",
      name: "Custom HTML — somente com revisão TI",
      type: "Custom HTML",
      status: "OPTIONAL",
      detail: "Proibido PII; exigir aprovação Admin/TI.",
    },
  ];
}

export function getRecommendedTriggers(): GtmInventoryItem[] {
  return [
    {
      id: "tr-ecopet-page",
      name: `Custom Event — ${GtmEvents.PAGE_VIEW}`,
      type: "Custom Event",
      status: "RECOMMENDED",
      detail: "Espelho SPA namespaced (não usar page_view nativo).",
    },
    {
      id: "tr-ecopet-ga",
      name: `Custom Event — ${GtmEvents.GA_MIRROR}`,
      type: "Custom Event",
      status: "RECOMMENDED",
      detail: "Espelho de eventos GA4 (ga_event).",
    },
    {
      id: "tr-consent",
      name: `Custom Event — ${GtmEvents.CONSENT}`,
      type: "Custom Event",
      status: "RECOMMENDED",
      detail: "Atualização de consentimento do banner.",
    },
    {
      id: "tr-ecommerce",
      name: `Custom Event — ${GtmEvents.ECOMMERCE}`,
      type: "Custom Event",
      status: "OPTIONAL",
      detail: "Funil marketplace / checkout.",
      module: "marketplace",
    },
    {
      id: "tr-all-pages-warn",
      name: "All Pages (GA4) — evitar se EcoPet gtag ativo",
      type: "Page View",
      status: "WARN",
      detail: "Risco de page_view duplicado.",
    },
  ];
}

export function getRecommendedVariables(): GtmInventoryItem[] {
  return [
    {
      id: "var-ga-event",
      name: "DLV — ga_event",
      type: "Data Layer Variable",
      status: "RECOMMENDED",
      detail: "Nome do evento GA espelhado.",
    },
    {
      id: "var-page-path",
      name: "DLV — page_path",
      type: "Data Layer Variable",
      status: "RECOMMENDED",
      detail: "Path sanitizado do ecopet_page_view.",
    },
    {
      id: "var-module",
      name: "DLV — module",
      type: "Data Layer Variable",
      status: "RECOMMENDED",
      detail: "Módulo EcoPet (marketplace, social, …).",
    },
    {
      id: "var-consent-analytics",
      name: "DLV — analytics_storage",
      type: "Data Layer Variable",
      status: "RECOMMENDED",
      detail: "Estado de consentimento analytics.",
    },
    {
      id: "var-container-id",
      name: "Container ID (constante GTM)",
      type: "Constant",
      status: "ACTIVE",
      detail: "Nativo do GTM — nunca expor completo no Admin EcoPet.",
    },
  ];
}

export const NAMESPACED_EVENT_PURPOSES: { name: string; purpose: string }[] = [
  { name: GtmEvents.PAGE_VIEW, purpose: "Navegação SPA (espelho)" },
  { name: GtmEvents.GA_MIRROR, purpose: "Espelho de eventos GA4" },
  { name: GtmEvents.ECOMMERCE, purpose: "Ações de ecommerce" },
  { name: GtmEvents.USER, purpose: "Contexto de usuário (hash/role)" },
  { name: GtmEvents.CONSENT, purpose: "Atualização Consent Mode v2" },
  { name: GtmEvents.LOGIN, purpose: "Login (opcional dedicado)" },
  { name: GtmEvents.SIGN_UP, purpose: "Cadastro" },
  { name: GtmEvents.ADD_TO_CART, purpose: "Carrinho" },
  { name: GtmEvents.BEGIN_CHECKOUT, purpose: "Checkout" },
  { name: GtmEvents.PURCHASE, purpose: "Compra" },
  { name: GtmEvents.SEARCH, purpose: "Busca" },
  { name: GtmEvents.SOCIAL, purpose: "Rede social" },
  { name: GtmEvents.PET, purpose: "Meu Pet" },
  { name: GtmEvents.APPOINTMENT, purpose: "Agenda" },
  { name: GtmEvents.AI, purpose: "IA" },
  { name: GtmEvents.ADMIN, purpose: "Admin (evitar em prod tags)" },
];
