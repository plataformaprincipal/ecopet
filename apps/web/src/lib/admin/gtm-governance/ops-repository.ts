import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const GTM_OPS_PROVIDER = "google_tag_manager";

export type GtmOpsSample = {
  event: string;
  at: string;
  module?: string;
};

export type GtmOpsSnapshot = {
  recentSamples: GtmOpsSample[];
  lastErrorCode: string | null;
  lastSyncAt: string | null;
  avgResponseMs: number | null;
  status: string;
};

/** Reutiliza AnalyticsOpsState — sem nova tabela / sem warehouse GTM. */
export async function getGtmOpsSnapshot(): Promise<GtmOpsSnapshot> {
  const row = await prisma.analyticsOpsState.findUnique({
    where: { provider: GTM_OPS_PROVIDER },
  });
  if (!row) {
    return {
      recentSamples: [],
      lastErrorCode: null,
      lastSyncAt: null,
      avgResponseMs: null,
      status: "UNKNOWN",
    };
  }
  const diag = (row.lastDiagnostics ?? {}) as { recentSamples?: GtmOpsSample[] };
  return {
    recentSamples: Array.isArray(diag.recentSamples) ? diag.recentSamples.slice(0, 50) : [],
    lastErrorCode: row.lastErrorCode,
    lastSyncAt: row.lastSyncAt?.toISOString() ?? null,
    avgResponseMs: row.avgResponseMs,
    status: row.status,
  };
}

export async function persistGtmHealth(input: {
  status: string;
  environment: string;
  avgResponseMs: number;
  catalogEventCount: number;
  diagnostics: Record<string, unknown>;
  errorCode?: string | null;
}) {
  const existing = await prisma.analyticsOpsState.findUnique({
    where: { provider: GTM_OPS_PROVIDER },
  });
  const prevDiag = (existing?.lastDiagnostics ?? {}) as { recentSamples?: GtmOpsSample[] };
  const merged = {
    ...input.diagnostics,
    recentSamples: prevDiag.recentSamples ?? [],
  };

  await prisma.analyticsOpsState.upsert({
    where: { provider: GTM_OPS_PROVIDER },
    create: {
      provider: GTM_OPS_PROVIDER,
      status: input.status,
      environment: input.environment,
      lastDiagnostics: merged as Prisma.InputJsonValue,
      lastHealthAt: new Date(),
      lastSyncAt: new Date(),
      lastSuccessAt: input.errorCode ? undefined : new Date(),
      lastErrorAt: input.errorCode ? new Date() : undefined,
      lastErrorCode: input.errorCode ?? null,
      avgResponseMs: input.avgResponseMs,
      catalogEventCount: input.catalogEventCount,
    },
    update: {
      status: input.status,
      environment: input.environment,
      lastDiagnostics: merged as Prisma.InputJsonValue,
      lastHealthAt: new Date(),
      lastSyncAt: new Date(),
      ...(input.errorCode
        ? { lastErrorAt: new Date(), lastErrorCode: input.errorCode }
        : { lastSuccessAt: new Date(), lastErrorCode: null }),
      avgResponseMs: input.avgResponseMs,
      catalogEventCount: input.catalogEventCount,
    },
  });
}

export async function appendGtmDataLayerSample(sample: GtmOpsSample) {
  const row = await prisma.analyticsOpsState.findUnique({
    where: { provider: GTM_OPS_PROVIDER },
  });
  const diag = (row?.lastDiagnostics ?? {}) as { recentSamples?: GtmOpsSample[] };
  const next = [sample, ...(diag.recentSamples ?? [])].slice(0, 50);

  await prisma.analyticsOpsState.upsert({
    where: { provider: GTM_OPS_PROVIDER },
    create: {
      provider: GTM_OPS_PROVIDER,
      status: "READY",
      lastDiagnostics: { recentSamples: next } as Prisma.InputJsonValue,
      lastSyncAt: new Date(),
    },
    update: {
      lastDiagnostics: {
        ...(typeof diag === "object" ? diag : {}),
        recentSamples: next,
      } as Prisma.InputJsonValue,
      lastSyncAt: new Date(),
    },
  });
}
