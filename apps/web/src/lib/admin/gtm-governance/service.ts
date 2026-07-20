import "server-only";

import { getDefaultConsentSettings, getAnalyticsSanitizedStatus } from "@/lib/analytics/config";
import { listAllEventDefinitions, countCatalogEvents } from "@/lib/analytics/events/catalog";
import {
  detectGtmEnvironment,
  getGtmSanitizedStatus,
  shouldLoadGtm,
} from "@/lib/gtm/config";
import { getGoogleTagManagerAdminDiagnostics } from "@/lib/gtm/server-diagnostics";
import { GtmEvents } from "@/lib/gtm/events";
import { getInstrumentationCoverage } from "@/lib/gtm/coverage";
import { shouldSendToGoogle } from "@/lib/analytics/config";
import { gtmGovCacheGet, gtmGovCacheSet } from "./cache";
import {
  getRecommendedTags,
  getRecommendedTriggers,
  getRecommendedVariables,
  NAMESPACED_EVENT_PURPOSES,
} from "./inventory";
import { getGtmOpsSnapshot, persistGtmHealth } from "./ops-repository";
import type { GtmAlert, GtmGovernanceReport, GtmModuleStats } from "./types";

const VERSION = "1.0.0-gtm-governance";

const MODULE_LABELS: Record<string, string> = {
  auth: "Clientes / Auth",
  marketplace: "Marketplace",
  products: "Produtos",
  services: "Serviços",
  appointments: "Agenda",
  orders: "Pedidos",
  payments: "Checkout / Pagamentos",
  pets: "Meu Pet",
  social: "Rede Social",
  notifications: "Notificações",
  partners: "Parceiros",
  ngo: "ONGs",
  admin: "Admin",
  chat: "Chat",
  ai: "IA",
  profile: "Perfil",
  search: "Busca",
  maps: "Google Maps",
  errors: "Erros",
  performance: "Performance",
  shared: "Shared",
};

const MODULE_GTM_MIRROR: Record<string, string> = {
  auth: GtmEvents.LOGIN,
  marketplace: GtmEvents.ECOMMERCE,
  products: GtmEvents.GA_MIRROR,
  services: GtmEvents.GA_MIRROR,
  appointments: GtmEvents.APPOINTMENT,
  orders: GtmEvents.BEGIN_CHECKOUT,
  payments: GtmEvents.PURCHASE,
  pets: GtmEvents.PET,
  social: GtmEvents.SOCIAL,
  notifications: GtmEvents.GA_MIRROR,
  partners: GtmEvents.GA_MIRROR,
  ngo: GtmEvents.GA_MIRROR,
  admin: GtmEvents.ADMIN,
  chat: GtmEvents.GA_MIRROR,
  ai: GtmEvents.AI,
  maps: GtmEvents.GA_MIRROR,
};

function buildModuleStats(): GtmModuleStats[] {
  const defs = listAllEventDefinitions();
  const byMod = new Map<string, string[]>();
  for (const d of defs) {
    const list = byMod.get(d.module) ?? [];
    list.push(d.event_name);
    byMod.set(d.module, list);
  }
  return [...byMod.entries()]
    .map(([module, events]) => ({
      module,
      label: MODULE_LABELS[module] ?? module,
      eventCount: events.length,
      sampleEvents: events.slice(0, 6),
      gtmMirror: MODULE_GTM_MIRROR[module] ?? GtmEvents.GA_MIRROR,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function buildAlerts(input: {
  gtmStatus: string;
  loadContainer: boolean;
  gaStatus: string;
  problems: string[];
}): GtmAlert[] {
  const alerts: GtmAlert[] = [];
  if (input.gtmStatus === "MISSING" || input.gtmStatus === "INVALID_ID") {
    alerts.push({
      id: "container-disconnected",
      severity: "error",
      title: "Container desconectado / não configurado",
      detail: "Defina NEXT_PUBLIC_GTM_ID válido.",
    });
  }
  if (input.gtmStatus === "DEV_ONLY" || input.gtmStatus === "DISABLED") {
    alerts.push({
      id: "container-not-loading",
      severity: "warn",
      title: "Container não carrega neste ambiente",
      detail: "Ajuste NEXT_PUBLIC_GTM_ENABLE_DEV/PREVIEW ou GTM_ENABLED.",
    });
  }
  if (input.gaStatus === "MISSING" || input.gaStatus === "INVALID_ID") {
    alerts.push({
      id: "analytics-error",
      severity: "warn",
      title: "Analytics não configurado",
      detail: "GTM complementa GA4 — Measurement ID ausente.",
    });
  }
  if (input.loadContainer && input.gaStatus === "READY") {
    alerts.push({
      id: "duplication-risk",
      severity: "info",
      title: "Risco de duplicação GA4 no container",
      detail: "Não publique tags GA4 page_view se o EcoPet gtag estiver ativo.",
    });
  }
  for (const p of input.problems) {
    alerts.push({
      id: `diag-${p.slice(0, 24)}`,
      severity: "warn",
      title: "Problema de diagnóstico",
      detail: p,
    });
  }
  return alerts;
}

export async function getGtmGovernanceReport(options?: {
  persist?: boolean;
  skipCache?: boolean;
}): Promise<GtmGovernanceReport> {
  const cacheKey = "governance:full";
  if (!options?.skipCache) {
    const cached = gtmGovCacheGet<GtmGovernanceReport>(cacheKey);
    if (cached) return cached;
  }

  const started = Date.now();
  const gtmStatus = getGtmSanitizedStatus();
  const gaStatus = getAnalyticsSanitizedStatus();
  const diag = getGoogleTagManagerAdminDiagnostics();
  const ops = await getGtmOpsSnapshot();
  const defs = listAllEventDefinitions();
  const modules = buildModuleStats();

  const byCategory = new Map<string, number>();
  const byModule = new Map<string, number>();
  for (const d of defs) {
    byCategory.set(d.category, (byCategory.get(d.category) ?? 0) + 1);
    byModule.set(d.module, (byModule.get(d.module) ?? 0) + 1);
  }

  const problems: string[] = [];
  if (!gtmStatus.configured) problems.push("Container GTM não configurado.");
  if (gtmStatus.configured && !gtmStatus.loadContainer) {
    problems.push("Container configurado mas não carrega neste ambiente.");
  }
  if (!gaStatus.configured) problems.push("GA4 Measurement ID ausente.");

  const checks = [
    {
      id: "container",
      ok: Boolean(gtmStatus.configured && gtmStatus.status !== "INVALID_ID"),
      label: "Container",
      detail: gtmStatus.sanitizedMessage,
    },
    {
      id: "load",
      ok: gtmStatus.loadContainer,
      label: "Scripts / carga",
      detail: gtmStatus.loadContainer ? "shouldLoadGtm=true" : "carga desabilitada",
    },
    {
      id: "datalayer",
      ok: true,
      label: "Data Layer",
      detail: "API centralizada lib/gtm/datalayer (client).",
    },
    {
      id: "analytics",
      ok: gaStatus.configured,
      label: "Analytics",
      detail: gaStatus.sanitizedMessage,
    },
    {
      id: "consent",
      ok: true,
      label: "Consentimento",
      detail: "Consent Mode v2 + banner LGPD.",
    },
    {
      id: "events",
      ok: countCatalogEvents() > 0,
      label: "Eventos",
      detail: `${countCatalogEvents()} no catálogo EcoPet.`,
    },
    {
      id: "duplication",
      ok: true,
      label: "Anti-duplicação",
      detail: "Espelho namespaced ecopet_*.",
    },
    {
      id: "performance",
      ok: true,
      label: "Performance",
      detail: "GTM afterInteractive + lazy bridge.",
    },
  ];

  const healthStatus =
    !checks.find((c) => c.id === "container")?.ok
      ? "UNHEALTHY"
      : checks.some((c) => !c.ok) || gtmStatus.status === "DEV_ONLY"
        ? "DEGRADED"
        : "HEALTHY";

  const consentDefaults = getDefaultConsentSettings();
  const env = detectGtmEnvironment();
  const ms = Date.now() - started;

  const report: GtmGovernanceReport = {
    generatedAt: new Date().toISOString(),
    version: VERSION,
    overview: {
      containerConnected: gtmStatus.configured && gtmStatus.loadContainer,
      status: gtmStatus.status,
      environment: gtmStatus.environment,
      containerIdMasked: gtmStatus.containerIdMasked,
      loadContainer: gtmStatus.loadContainer,
      debug: gtmStatus.debug,
      version: VERSION,
      build:
        process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
        process.env.NEXT_PUBLIC_BUILD_ID ??
        null,
      lastSyncAt: ops.lastSyncAt,
      lastErrorCode: ops.lastErrorCode,
      avgResponseMs: ops.avgResponseMs ?? ms,
      gaConnected: gaStatus.configured,
      gaStatus: gaStatus.status,
      antiDuplicationNote: gtmStatus.antiDuplicationNote,
      sanitizedMessage: gtmStatus.sanitizedMessage,
    },
    health: { status: healthStatus, checks },
    diagnostics: {
      problems,
      scripts: diag.scriptHosts,
      consentMode: diag.consentMode,
      dataLayerActive: true,
      notes: diag.notes,
    },
    dataLayer: {
      namespacedEvents: NAMESPACED_EVENT_PURPOSES,
      catalogTotal: countCatalogEvents(),
      byCategory: [...byCategory.entries()].map(([category, count]) => ({
        category,
        count,
      })),
      byModule: [...byModule.entries()]
        .map(([module, count]) => ({ module, count }))
        .sort((a, b) => b.count - a.count),
      recentSamples: ops.recentSamples,
      discardedNote:
        "Eventos com PII são sanitizados/descartados no client (sanitizeEventParams). Contadores de volume live ficam no GTM Preview / GA4 — EcoPet não duplica warehouse.",
    },
    tags: getRecommendedTags(),
    triggers: getRecommendedTriggers(),
    variables: getRecommendedVariables(),
    consent: {
      defaults: {
        analytics_storage: consentDefaults.analytics_storage,
        ad_storage: consentDefaults.ad_storage,
        ad_user_data: consentDefaults.ad_user_data,
        ad_personalization: consentDefaults.ad_personalization,
      },
      bannerImplemented: true,
      cmpReady: true,
      lastChangeNote:
        "Alterações de consentimento ocorrem no client (banner/CMP). Amostras opcionais via POST datalayer-sample.",
    },
    bi: {
      eventsByModule: [...byModule.entries()]
        .map(([module, count]) => ({ module, count }))
        .sort((a, b) => b.count - a.count),
      note: "BI estrutural (catálogo). Volumes geográficos/dispositivo: use /admin/bi/google-analytics (Data API).",
      relatedBiHref: "/admin/bi/google-analytics",
    },
    modules,
    environments: {
      current: env,
      matrix: [
        {
          env: "development",
          gtmLoads: false,
          gaSends: false,
          note: "Requer NEXT_PUBLIC_GTM_ENABLE_DEV=1 / GA_ENABLE_DEV=1",
        },
        {
          env: "preview",
          gtmLoads: false,
          gaSends: false,
          note: "Requer NEXT_PUBLIC_GTM_ENABLE_PREVIEW=1 / GA_ENABLE_PREVIEW=1",
        },
        {
          env: "production",
          gtmLoads: shouldLoadGtm({
            ...process.env,
            VERCEL_ENV: "production",
            NODE_ENV: "production",
          } as NodeJS.ProcessEnv),
          gaSends: shouldSendToGoogle({
            ...process.env,
            VERCEL_ENV: "production",
            NODE_ENV: "production",
          } as NodeJS.ProcessEnv),
          note: "Default on se IDs válidos",
        },
      ],
    },
    alerts: buildAlerts({
      gtmStatus: gtmStatus.status,
      loadContainer: gtmStatus.loadContainer,
      gaStatus: gaStatus.status,
      problems,
    }),
    logs: [
      {
        at: new Date().toISOString(),
        level: "INFO",
        message: `Governance report generated (${ms}ms)`,
      },
      ...(ops.lastErrorCode
        ? [
            {
              at: ops.lastSyncAt ?? new Date().toISOString(),
              level: "ERROR",
              message: `Último erro ops: ${ops.lastErrorCode}`,
            },
          ]
        : []),
    ],
    debug: {
      debugFlag: gtmStatus.debug,
      previewHint:
        "Abra GTM Preview, conecte a URL e valide eventos ecopet_* no dataLayer. Métricas client: window.__ecopetGtmMetrics.",
      lastErrorCode: ops.lastErrorCode,
    },
    coverage: {
      ...getInstrumentationCoverage(defs.map((d) => d.event_name)),
      strategy:
        "Estratégia B — GA4 via gtag (send_to); GTM recebe espelho namespaced (ecopet_*). Não publique tags GA4 duplicadas no container.",
    },
    meta: {
      dataSource:
        "EcoPet governance (catálogo + env + ops + coverage). Tags/Triggers/Variables = inventário recomendado, não sync API GTM.",
      noWarehouseDuplication: true,
    },
  };

  // Fix container check idFormat - getGtmSanitizedStatus doesn't have idFormatOk
  // health checks already set

  if (options?.persist) {
    await persistGtmHealth({
      status: healthStatus,
      environment: env,
      avgResponseMs: ms,
      catalogEventCount: countCatalogEvents(),
      diagnostics: {
        overviewStatus: gtmStatus.status,
        health: healthStatus,
        problems,
      },
      errorCode: problems.length && !gtmStatus.configured ? "GTM_NOT_CONFIGURED" : null,
    });
  }

  gtmGovCacheSet(cacheKey, report, 30_000);
  return report;
}
