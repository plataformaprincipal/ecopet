import "server-only";

import {
  getAnalyticsSanitizedStatus,
  getGaMeasurementId,
  maskMeasurementId,
  shouldSendToGoogle,
  isGaConfigured,
} from "./config";

/**
 * Compat Prompt 1 — diagnóstico leve síncrono.
 * Preferir AnalyticsServerService.diagnostics() para ops completas.
 */
export function getGoogleAnalyticsAdminDiagnostics() {
  const status = getAnalyticsSanitizedStatus();
  const id = getGaMeasurementId();

  return {
    provider: "google-analytics-4",
    version: "gtag-consent-mode-v2",
    status,
    measurementIdConfigured: Boolean(id),
    measurementIdMasked: maskMeasurementId(id),
    sendToGoogle: shouldSendToGoogle(),
    scriptHosts: [
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
    ],
    consentMode: "v2",
    notes: [
      "Measurement ID nunca é retornado completo.",
      "Page views de /admin, /api e auth são excluídos.",
      "Envio desabilitado em development por padrão (LGPD + ruído).",
      "Consent Mode v2: defaults denied até grant explícito.",
      "Ops enterprise: /api/admin/analytics/*",
      "Dados de eventos ficam no Google Analytics — EcoPet não duplica o warehouse.",
    ],
    health: {
      envOk: status.configured,
      idFormatOk: status.status !== "INVALID_ID",
      runtimeReady: status.status === "READY",
    },
  };
}

export {
  getAnalyticsSanitizedStatus,
  getGaMeasurementId,
  maskMeasurementId,
  shouldSendToGoogle,
  isGaConfigured,
};
