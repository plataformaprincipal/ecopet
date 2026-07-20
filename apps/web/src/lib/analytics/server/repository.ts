import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ANALYTICS_PROVIDER, type AnalyticsConfigFlags, type AnalyticsOpsStatus } from "./types";

export type OpsStateRow = {
  id: string;
  provider: string;
  status: string;
  environment: string | null;
  configFlags: AnalyticsConfigFlags;
  lastDiagnostics: Record<string, unknown> | null;
  lastHealthAt: Date | null;
  lastSuccessAt: Date | null;
  lastErrorAt: Date | null;
  lastErrorCode: string | null;
  lastSyncAt: Date | null;
  avgResponseMs: number | null;
  catalogEventCount: number | null;
  updatedById: string | null;
  updatedAt: Date;
};

function parseFlags(value: unknown): AnalyticsConfigFlags {
  if (!value || typeof value !== "object") return {};
  return value as AnalyticsConfigFlags;
}

function mapRow(row: {
  id: string;
  provider: string;
  status: string;
  environment: string | null;
  configFlags: unknown;
  lastDiagnostics: unknown;
  lastHealthAt: Date | null;
  lastSuccessAt: Date | null;
  lastErrorAt: Date | null;
  lastErrorCode: string | null;
  lastSyncAt: Date | null;
  avgResponseMs: number | null;
  catalogEventCount: number | null;
  updatedById: string | null;
  updatedAt: Date;
}): OpsStateRow {
  return {
    ...row,
    configFlags: parseFlags(row.configFlags),
    lastDiagnostics:
      row.lastDiagnostics && typeof row.lastDiagnostics === "object"
        ? (row.lastDiagnostics as Record<string, unknown>)
        : null,
  };
}

export async function getOrCreateOpsState(): Promise<OpsStateRow> {
  const existing = await prisma.analyticsOpsState.findUnique({
    where: { provider: ANALYTICS_PROVIDER },
  });
  if (existing) return mapRow(existing);
  const created = await prisma.analyticsOpsState.create({
    data: {
      provider: ANALYTICS_PROVIDER,
      status: "UNKNOWN",
      configFlags: {},
    },
  });
  return mapRow(created);
}

export async function updateOpsState(input: {
  status?: AnalyticsOpsStatus;
  environment?: string;
  configFlags?: AnalyticsConfigFlags;
  lastDiagnostics?: Record<string, unknown> | null;
  lastHealthAt?: Date;
  lastSuccessAt?: Date;
  lastErrorAt?: Date;
  lastErrorCode?: string | null;
  lastSyncAt?: Date;
  avgResponseMs?: number;
  catalogEventCount?: number;
  updatedById?: string;
}): Promise<OpsStateRow> {
  const data: Prisma.AnalyticsOpsStateUpdateInput = {};
  if (input.status) data.status = input.status;
  if (input.environment !== undefined) data.environment = input.environment;
  if (input.configFlags) data.configFlags = input.configFlags as Prisma.InputJsonValue;
  if (input.lastDiagnostics !== undefined) {
    data.lastDiagnostics =
      input.lastDiagnostics === null
        ? Prisma.DbNull
        : (input.lastDiagnostics as Prisma.InputJsonValue);
  }
  if (input.lastHealthAt) data.lastHealthAt = input.lastHealthAt;
  if (input.lastSuccessAt) data.lastSuccessAt = input.lastSuccessAt;
  if (input.lastErrorAt) data.lastErrorAt = input.lastErrorAt;
  if (input.lastErrorCode !== undefined) data.lastErrorCode = input.lastErrorCode;
  if (input.lastSyncAt) data.lastSyncAt = input.lastSyncAt;
  if (input.avgResponseMs !== undefined) data.avgResponseMs = input.avgResponseMs;
  if (input.catalogEventCount !== undefined) data.catalogEventCount = input.catalogEventCount;
  if (input.updatedById) data.updatedById = input.updatedById;

  const row = await prisma.analyticsOpsState.upsert({
    where: { provider: ANALYTICS_PROVIDER },
    create: {
      provider: ANALYTICS_PROVIDER,
      status: input.status ?? "UNKNOWN",
      environment: input.environment,
      configFlags: (input.configFlags ?? {}) as Prisma.InputJsonValue,
      catalogEventCount: input.catalogEventCount,
      updatedById: input.updatedById,
    },
    update: data,
  });
  return mapRow(row);
}

export async function recordOpsError(input: {
  code: string;
  message: string;
  module?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.analyticsOpsError.create({
    data: {
      provider: ANALYTICS_PROVIDER,
      code: input.code.slice(0, 80),
      message: input.message.slice(0, 500),
      module: input.module?.slice(0, 80),
      metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function listRecentOpsErrors(limit = 20) {
  return prisma.analyticsOpsError.findMany({
    where: { provider: ANALYTICS_PROVIDER },
    orderBy: { createdAt: "desc" },
    take: Math.min(50, Math.max(1, limit)),
    select: {
      id: true,
      code: true,
      message: true,
      module: true,
      createdAt: true,
    },
  });
}
