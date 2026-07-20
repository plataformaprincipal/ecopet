import "server-only";

import { getGtmHealth } from "./health";
import { getGtmSanitizedStatus } from "./config";

const GTM_MODULE_VERSION = "1.0.0-gtm";

/** Diagnóstico ADMIN — nunca retorna Container ID completo. */
export function getGoogleTagManagerAdminDiagnostics() {
  const status = getGtmSanitizedStatus();
  const health = getGtmHealth();
  return {
    provider: "google-tag-manager",
    version: GTM_MODULE_VERSION,
    status,
    containerConfigured: status.configured,
    containerIdMasked: status.containerIdMasked,
    loadContainer: status.loadContainer,
    scriptHosts: [
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
    ],
    consentMode: "v2",
    health: {
      envOk: status.status !== "MISSING" && status.status !== "INVALID_ID",
      idFormatOk: health.idFormatOk,
      runtimeReady: health.ready,
    },
    notes: [
      status.antiDuplicationNote,
      "Use GTM Preview para validar dataLayer (eventos ecopet_*).",
      "GA4 continua via provider EcoPet (gtag) — não duplique tags GA4 no container.",
      "Container ID nunca é retornado completo nesta API.",
    ],
    generatedAt: new Date().toISOString(),
  };
}
