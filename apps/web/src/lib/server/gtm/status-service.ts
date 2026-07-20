import "server-only";

import {
  getGtmSanitizedStatus,
  isValidGtmContainerId,
  getGtmContainerId,
} from "@/lib/gtm/config";
import { GTM_EVENT_VERSION } from "@/lib/gtm/contract";
import { getGtmOpsSnapshot } from "@/lib/admin/gtm-governance/ops-repository";
import { getGtmOpsConfig } from "./config-service";
import { getDedupStats } from "./deduplication-service";
import { getGtmEventCatalog } from "./catalog-service";
import { prisma } from "@/lib/prisma";

export async function getGtmBackendStatus() {
  const gtm = getGtmSanitizedStatus();
  const ops = await getGtmOpsSnapshot();
  const config = await getGtmOpsConfig();
  const catalog = getGtmEventCatalog({ pageSize: 1 });
  let dedup = { claims: 0, duplicatesBlocked: 0, available: false };
  try {
    dedup = await getDedupStats();
  } catch {
    dedup = { claims: 0, duplicatesBlocked: 0, available: false };
  }

  return {
    configured: gtm.configured,
    enabled: config.flags.collectionEnabled && gtm.loadContainer,
    environment: gtm.environment,
    maskedContainerId: gtm.containerIdMasked,
    consentRequired: config.flags.consentRequired,
    eventContractVersion: config.flags.eventContractVersion ?? GTM_EVENT_VERSION,
    healthStatus: ops.status || gtm.status,
    lastHealthCheckAt: ops.lastSyncAt,
    lastSuccessfulEventAt: ops.lastSyncAt,
    lastErrorCode: ops.lastErrorCode,
    debugEnabled: config.flags.debugEnabled,
    catalogTotal: catalog.total,
    catalogCoveragePct: catalog.coveragePct,
    deduplication: dedup,
    notes: [
      "Container ID vem de NEXT_PUBLIC_GTM_ID (env) — não editável pelo painel.",
      "Hits GA4 permanecem no gtag; GTM usa espelho namespaced (Estratégia B).",
    ],
  };
}

export async function runGtmBackendHealth(persist = false) {
  const started = Date.now();
  const id = getGtmContainerId();
  const gtm = getGtmSanitizedStatus();
  const config = await getGtmOpsConfig();

  let databaseOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseOk = true;
  } catch {
    databaseOk = false;
  }

  let dedupOk = false;
  try {
    await getDedupStats();
    dedupOk = true;
  } catch {
    dedupOk = false;
  }

  const checks = [
    {
      id: "GTM_ID_PRESENT",
      ok: Boolean(id),
      detail: id ? "presente" : "ausente",
    },
    {
      id: "GTM_ID_FORMAT_VALID",
      ok: id ? isValidGtmContainerId(id) : false,
      detail: id ? (isValidGtmContainerId(id) ? "válido" : "inválido") : "n/a",
    },
    {
      id: "GTM_FRONTEND_MODULE_AVAILABLE",
      ok: true,
      detail: "lib/gtm/*",
    },
    {
      id: "DATA_LAYER_CONTRACT_AVAILABLE",
      ok: true,
      detail: `event_version=${GTM_EVENT_VERSION}`,
    },
    {
      id: "CONSENT_MODULE_AVAILABLE",
      ok: true,
      detail: "lib/analytics/consent",
    },
    {
      id: "EVENT_CATALOG_AVAILABLE",
      ok: getGtmEventCatalog({ pageSize: 1 }).total > 0,
      detail: "catálogo código",
    },
    {
      id: "DATABASE_AVAILABLE",
      ok: databaseOk,
      detail: databaseOk ? "ok" : "falha",
    },
    {
      id: "DEDUPLICATION_AVAILABLE",
      ok: dedupOk,
      detail: dedupOk ? "AnalyticsTransactionalDedup" : "indisponível",
    },
    {
      id: "ADMIN_CONFIGURATION_AVAILABLE",
      ok: true,
      detail: `collection=${config.flags.collectionEnabled}`,
    },
    {
      id: "COLLECTION_ENABLED",
      ok: config.flags.collectionEnabled,
      detail: config.flags.collectionEnabled ? "on" : "pausada",
    },
  ];

  const criticalFail = checks.some(
    (c) =>
      !c.ok &&
      ["GTM_ID_FORMAT_VALID", "DATABASE_AVAILABLE", "DATA_LAYER_CONTRACT_AVAILABLE"].includes(
        c.id
      )
  );
  const anyFail = checks.some((c) => !c.ok);

  let status: "healthy" | "degraded" | "unhealthy" | "not_configured" = "healthy";
  if (!gtm.configured) status = "not_configured";
  else if (criticalFail) status = "unhealthy";
  else if (anyFail || gtm.status === "DEV_ONLY") status = "degraded";

  const ms = Date.now() - started;

  if (persist) {
    const { persistGtmHealth } = await import(
      "@/lib/admin/gtm-governance/ops-repository"
    );
    await persistGtmHealth({
      status: status.toUpperCase(),
      environment: gtm.environment,
      avgResponseMs: ms,
      catalogEventCount: getGtmEventCatalog({ pageSize: 1 }).total,
      diagnostics: { checks, status },
      errorCode: status === "unhealthy" ? "GTM_HEALTH_UNHEALTHY" : null,
    });
  }

  return {
    status,
    responseMs: ms,
    checks,
    maskedContainerId: gtm.containerIdMasked,
    environment: gtm.environment,
    limitations: [
      "Variável configurada ≠ container publicado no Google.",
      "Tags disparando / hits no GA4 exigem validação manual (Preview/DebugView).",
    ],
  };
}

export async function runGtmBackendDiagnostics() {
  const health = await runGtmBackendHealth(false);
  const status = await getGtmBackendStatus();
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  for (const c of health.checks) {
    if (!c.ok) {
      if (c.id.startsWith("GTM_ID") || c.id === "DATABASE_AVAILABLE") {
        errors.push(`${c.id}: ${c.detail}`);
      } else {
        warnings.push(`${c.id}: ${c.detail}`);
      }
    }
  }
  if (status.catalogCoveragePct < 20) {
    warnings.push("Cobertura de instrumentação baixa no código.");
    recommendations.push("Ampliar wiring dos eventos do catálogo nos módulos.");
  }
  recommendations.push(
    "No GTM: triggers Custom Event em ecopet_* — não republicar page_view GA4."
  );
  recommendations.push("Validar no GTM Preview e GA4 DebugView após deploy.");

  return {
    environment: status.environment,
    buildVersion:
      process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
      process.env.NEXT_PUBLIC_BUILD_ID ??
      null,
    timestamp: new Date().toISOString(),
    health: health.status,
    checks: health.checks,
    errors,
    warnings,
    recommendations,
    statusSummary: {
      configured: status.configured,
      enabled: status.enabled,
      maskedContainerId: status.maskedContainerId,
      lastErrorCode: status.lastErrorCode,
    },
  };
}
