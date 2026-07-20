import {
  getGtmSanitizedStatus,
  isValidGtmContainerId,
  getGtmContainerId,
  shouldLoadGtm,
} from "@/lib/gtm/config";
import { GTM_EVENT_VERSION } from "@/lib/gtm/contract";
import type { ProductionCheckItem } from "./types";

/**
 * Checks de go-live GTM — estáticos + env.
 * Não consulta API remota do Google; Preview/DebugView permanecem MANUAL.
 */
export function getGtmProductionChecks(): ProductionCheckItem[] {
  const gtm = getGtmSanitizedStatus();
  const id = getGtmContainerId();
  const load = shouldLoadGtm();
  const env = gtm.environment;
  const isProdLike = env === "production";

  return [
    {
      id: "gtm-id-present",
      area: "GTM",
      title: "Container ID (env)",
      status: id ? "PASS" : isProdLike ? "FAIL" : "WARN",
      detail: id
        ? `Configurado: ${gtm.containerIdMasked}`
        : "NEXT_PUBLIC_GTM_ID ausente ou inválido — fonte de verdade é a env.",
      href: "/admin/producao/google-tag-manager",
    },
    {
      id: "gtm-id-format",
      area: "GTM",
      title: "Formato GTM-XXXX",
      status: !process.env.NEXT_PUBLIC_GTM_ID?.trim()
        ? "N/A"
        : id && isValidGtmContainerId(id)
          ? "PASS"
          : "FAIL",
      detail: id ? "Formato válido." : "Valor presente mas formato inválido.",
    },
    {
      id: "gtm-load-policy",
      area: "GTM",
      title: "Política de carga do container",
      status: load ? "PASS" : id ? "WARN" : "N/A",
      detail: load
        ? `Container elegível para carga (${env}).`
        : "ID ok mas carga desligada (dev/preview sem flag, ou NEXT_PUBLIC_GTM_ENABLED=false).",
    },
    {
      id: "gtm-contract-version",
      area: "GTM",
      title: "Contrato Data Layer",
      status: "PASS",
      detail: `event_version=${GTM_EVENT_VERSION} — pipeline tipado ativo.`,
      href: "/admin/integracoes/google-tag-manager",
    },
    {
      id: "gtm-strategy-b",
      area: "GTM",
      title: "Anti-duplicação Estratégia B",
      status: "PASS",
      detail:
        "GA4 via gtag; GTM recebe espelhos namespaced (ecopet_*). Não publicar tags GA4 duplicadas no container.",
    },
    {
      id: "gtm-consent-bridge",
      area: "GTM",
      title: "Consent Mode ↔ GTM",
      status: "PASS",
      detail: "lib/gtm/consent espelha updates do Consent Mode v2 no Data Layer.",
    },
    {
      id: "gtm-dedup-server",
      area: "GTM",
      title: "Deduplicação transacional server",
      status: "PASS",
      detail: "AnalyticsTransactionalDedup + claim em purchase/refund.",
      href: "/admin/integracoes/google-tag-manager",
    },
    {
      id: "gtm-admin-apis",
      area: "GTM",
      title: "APIs admin GTM",
      status: "PASS",
      detail: "/api/admin/gtm/{status,health,diagnostics,config,events,audit,test,cache}",
      href: "/api/admin/gtm/status",
    },
    {
      id: "gtm-preview",
      area: "GTM",
      title: "GTM Preview aprovado",
      status: "MANUAL",
      detail: "Validar tags/triggers/variables no Preview do container de produção.",
    },
    {
      id: "gtm-tag-assistant",
      area: "GTM",
      title: "Tag Assistant",
      status: "MANUAL",
      detail: "Confirmar container e hits sem erros de CSP/bloqueio.",
    },
    {
      id: "gtm-ga4-debugview",
      area: "GTM",
      title: "GA4 DebugView (pós-GTM)",
      status: "MANUAL",
      detail: "Confirmar eventos únicos (purchase 1×) após fluxo marketplace.",
      href: "/admin/integracoes/google-analytics",
    },
    {
      id: "gtm-purchase-once",
      area: "GTM",
      title: "Purchase sem duplicação",
      status: "MANUAL",
      detail: "Checkout aprovado → reload → sem segundo purchase no DebugView.",
    },
  ];
}

export function getGtmServiceStatus() {
  const gtm = getGtmSanitizedStatus();
  return {
    id: "gtm",
    name: "Google Tag Manager",
    status: gtm.status,
    configured: gtm.configured,
    detail: gtm.containerIdMasked ?? gtm.sanitizedMessage,
  };
}

/** Versões documentadas da stack GTM (sem inventar sync remoto). */
export function getGtmStackVersions() {
  return {
    productionModule: "1.1.0-production-gtm",
    governance: "1.0.0-gtm-governance",
    eventContract: GTM_EVENT_VERSION,
    strategy: "B",
  };
}
