import "server-only";

import { auditProductionEnv } from "@/lib/validate-production-env";
import { getAllIntegrationStatuses } from "@/lib/integrations/integration-status";
import { getObservabilityProviders } from "@/lib/observability/providers";
import { getAnalyticsSanitizedStatus, detectAnalyticsEnvironment } from "@/lib/analytics/config";
import { getGaDataApiConfig } from "@/lib/admin/bi/ga-data-client";
import { prisma } from "@/lib/prisma";
import { getLgpdChecklist } from "./lgpd-checklist";
import { getSecurityAuditChecks } from "./security-audit";
import { getSeoAuditChecks } from "./seo-audit";
import {
  getGtmProductionChecks,
  getGtmServiceStatus,
} from "./gtm-production-audit";
import {
  getSupabaseInfrastructureChecks,
  getSupabaseSanitizedSummary,
} from "./supabase-audit";
import type {
  ProductionCheckItem,
  ProductionReadinessReport,
  ProductionServiceStatus,
} from "./types";

const MODULE_VERSION = "1.2.0-production-supabase";

async function probeDatabase(): Promise<ProductionServiceStatus> {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      id: "database",
      name: "PostgreSQL",
      status: "ONLINE",
      configured: true,
      detail: `${Date.now() - started}ms`,
    };
  } catch {
    return {
      id: "database",
      name: "PostgreSQL",
      status: "OFFLINE",
      configured: Boolean(process.env.DATABASE_URL),
      detail: "Falha no ping",
    };
  }
}

function mapIntegrations(): ProductionServiceStatus[] {
  return getAllIntegrationStatuses().map((i) => ({
    id: i.provider,
    name: i.displayName,
    status: i.status,
    configured: i.configured,
    detail: i.sanitizedError,
  }));
}

function buildEnvChecks(): ProductionCheckItem[] {
  const report = auditProductionEnv();
  const items: ProductionCheckItem[] = [];
  for (const c of report.critical) {
    items.push({
      id: `env-critical-${c}`,
      area: "Ambiente",
      title: `Crítico: ${c}`,
      status: "FAIL",
      detail: "Variável obrigatória ausente.",
    });
  }
  for (const r of report.recommended) {
    items.push({
      id: `env-rec-${r.slice(0, 40)}`,
      area: "Ambiente",
      title: "Recomendado",
      status: "WARN",
      detail: r,
    });
  }
  for (const w of report.warnings) {
    items.push({
      id: `env-warn-${w.slice(0, 40)}`,
      area: "Ambiente",
      title: "Aviso de ambiente",
      status: "WARN",
      detail: w,
    });
  }
  if (items.length === 0) {
    items.push({
      id: "env-ok",
      area: "Ambiente",
      title: "Variáveis críticas",
      status: "PASS",
      detail: "DATABASE_URL e secrets de auth presentes.",
    });
  }
  return items;
}

function buildAnalyticsChecks(): ProductionCheckItem[] {
  const tracking = getAnalyticsSanitizedStatus();
  const dataApi = getGaDataApiConfig();
  return [
    {
      id: "ga-measurement",
      area: "Analytics",
      title: "Measurement ID",
      status:
        tracking.status === "READY"
          ? "PASS"
          : tracking.status === "DEV_ONLY" || tracking.status === "DISABLED"
            ? "WARN"
            : "FAIL",
      detail: tracking.sanitizedMessage,
      href: "/admin/integracoes/google-analytics",
    },
    {
      id: "ga-data-api",
      area: "Analytics",
      title: "GA Data API (BI)",
      status: dataApi.configured ? "PASS" : "WARN",
      detail: dataApi.configured
        ? "Property + service account configurados."
        : "GA4_PROPERTY_ID / service account ausentes — BI inbound limitado.",
      href: "/admin/bi/google-analytics",
    },
    {
      id: "ga-debugview",
      area: "Analytics",
      title: "DebugView validado",
      status: "MANUAL",
      detail: "Confirmar hits no GA4 DebugView com NEXT_PUBLIC_GA_DEBUG=1 em preview.",
    },
  ];
}

function buildPerformanceChecks(): ProductionCheckItem[] {
  return [
    {
      id: "perf-fonts",
      area: "Performance",
      title: "Fonts next/font",
      status: "PASS",
      detail: "Inter + Plus Jakarta Sans via next/font (self-host).",
    },
    {
      id: "perf-images",
      area: "Performance",
      title: "Images",
      status: "WARN",
      detail: "Validar next/image + Cloudinary em páginas pesadas (Lighthouse staging).",
    },
    {
      id: "perf-gtm-third-party",
      area: "Performance",
      title: "Budget GTM / gtag",
      status: "WARN",
      detail:
        "Scripts GTM/gtag são third-party — validar peso no Lighthouse e evitar tags pesadas no container.",
    },
    {
      id: "perf-lighthouse",
      area: "Performance",
      title: "Lighthouse staging",
      status: "MANUAL",
      detail: "Executar Lighthouse Performance/A11y/BP/SEO ≥ 90 em staging.",
    },
    {
      id: "perf-code-split",
      area: "Performance",
      title: "Lazy panels",
      status: "PASS",
      detail: "Support chat e vários painéis usam dynamic import.",
    },
  ];
}

function buildLaunchChecklist(): ProductionCheckItem[] {
  return [
    {
      id: "launch-gtm-preview",
      area: "Checklist",
      title: "GTM Preview + GA4 DebugView",
      status: "MANUAL",
      detail: "Roteiro: docs/runbooks/google-tag-manager-manual-validation.md",
      href: "/admin/producao/google-tag-manager",
    },
    {
      id: "launch-build",
      area: "Checklist",
      title: "Build / type-check / lint",
      status: "MANUAL",
      detail: "Confirmar CI verde no commit de release.",
    },
    {
      id: "launch-migrate",
      area: "Checklist",
      title: "Migrations aplicadas",
      status: "MANUAL",
      detail: "npm run db:migrate:deploy no ambiente alvo.",
    },
    {
      id: "launch-rollback",
      area: "Checklist",
      title: "Rollback documentado",
      status: "PASS",
      detail: "Ver docs/deploy/rollback-checklist.md",
      href: "/admin/producao",
    },
    {
      id: "launch-monitoring",
      area: "Checklist",
      title: "Monitoramento pós-deploy",
      status: "MANUAL",
      detail: "Health /api/health + painel Produção + logs Vercel nas primeiras 2h.",
    },
  ];
}

export async function getProductionReadinessReport(): Promise<ProductionReadinessReport> {
  const db = await probeDatabase();
  const integrations = mapIntegrations();
  const obs = getObservabilityProviders().map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    configured: p.status === "ACTIVE",
    detail: p.description,
  }));

  const analytics = getAnalyticsSanitizedStatus();
  const gtmSvc = getGtmServiceStatus();
  const services: ProductionServiceStatus[] = [
    db,
    gtmSvc,
    {
      id: "analytics",
      name: "Google Analytics 4",
      status: analytics.status,
      configured: analytics.configured,
      detail: analytics.measurementIdMasked ?? undefined,
    },
    ...integrations,
    ...obs,
  ];

  const checks: ProductionCheckItem[] = [
    ...buildEnvChecks(),
    ...getSecurityAuditChecks(),
    ...getLgpdChecklist(),
    ...getSeoAuditChecks(),
    ...buildAnalyticsChecks(),
    ...getGtmProductionChecks(),
    ...getSupabaseInfrastructureChecks(),
    ...buildPerformanceChecks(),
    ...buildLaunchChecklist(),
    {
      id: "db-online",
      area: "Health",
      title: "Banco online",
      status: db.status === "ONLINE" ? "PASS" : "FAIL",
      detail: db.detail ?? db.status,
    },
  ];

  const summary = {
    pass: checks.filter((c) => c.status === "PASS").length,
    warn: checks.filter((c) => c.status === "WARN").length,
    fail: checks.filter((c) => c.status === "FAIL").length,
    manual: checks.filter((c) => c.status === "MANUAL" || c.status === "N/A").length,
  };

  const overall =
    summary.fail > 0
      ? "NOT_READY"
      : summary.warn > 0
        ? "READY_WITH_WARNINGS"
        : "READY";

  const supabase = getSupabaseSanitizedSummary();

  return {
    generatedAt: new Date().toISOString(),
    environment: detectAnalyticsEnvironment(),
    version: MODULE_VERSION,
    build:
      process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
      process.env.NEXT_PUBLIC_BUILD_ID ??
      null,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    overall,
    services,
    checks,
    summary,
    supabase,
    meta: {
      lastSyncAt: new Date().toISOString(),
      notes: [
        "Não duplica warehouse GA4/GTM.",
        "GTM: Estratégia B — sem tags GA4 duplicadas no container.",
        "Supabase = Postgres gerenciado via Prisma; Storage Cloudinary; Auth custom.",
        "PITR não habilitado — não ativar automaticamente.",
        "Itens MANUAL exigem validação humana (Preview, DebugView, Lighthouse, DPO, retenção backup).",
        "Sentry permanece stub até @sentry/nextjs ser habilitado.",
      ],
    },
  };
}
