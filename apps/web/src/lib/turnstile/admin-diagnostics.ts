import "server-only";

import { getTurnstilePublicConfig, maskSiteKey } from "./config";
import { getTurnstileSanitizedStatus } from "./server-config";
import { TURNSTILE_PROTECTED_FLOWS } from "./actions";
import { getTurnstileMetricsSummary } from "./metrics";
import { TURNSTILE_PROVIDER } from "./constants";

export async function getTurnstileAdminDiagnostics() {
  const status = getTurnstileSanitizedStatus();
  const publicConfig = getTurnstilePublicConfig();
  const metrics = await getTurnstileMetricsSummary(24);

  let integrationStatus = status.status;
  if (status.enabled && status.configured) {
    if (metrics.unavailable > 0 && metrics.successRate < 50 && metrics.total >= 5) {
      integrationStatus = "DEGRADED";
    } else if (metrics.hostnameFailures > metrics.approved && metrics.total >= 5) {
      integrationStatus = "HOSTNAME_ERROR";
    } else if (metrics.actionFailures > metrics.approved && metrics.total >= 5) {
      integrationStatus = "ACTION_ERROR";
    } else if (metrics.unavailable > 10 && metrics.approved === 0) {
      integrationStatus = "CLOUDFLARE_UNAVAILABLE";
    } else {
      integrationStatus = "ACTIVE";
    }
  }

  return {
    provider: TURNSTILE_PROVIDER,
    version: "1.0.0",
    status: {
      ...status,
      status: integrationStatus,
      siteKeyMasked: maskSiteKey(publicConfig.siteKey || undefined),
      secretKeyConfigured: status.secretKeyConfigured,
      // Nunca site key completa se política de mascaramento
    },
    flows: TURNSTILE_PROTECTED_FLOWS,
    metrics,
    notes: [
      "Secret Key nunca é retornada por este endpoint.",
      "Tokens Turnstile não são persistidos — apenas hash SHA-256 com retenção curta.",
      "Rate limit em memória + RateLimitBucket no PostgreSQL para multi-instância.",
      "Preview: configure TURNSTILE_PREVIEW_HOSTNAMES ou TURNSTILE_ALLOWED_HOSTNAMES.",
    ],
  };
}
