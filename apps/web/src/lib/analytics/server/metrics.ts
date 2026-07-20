import "server-only";

import { prisma } from "@/lib/prisma";
import { countCatalogEvents } from "../events/catalog";
import { analyticsCacheStats } from "./cache";
import { getAnalyticsQueueStats } from "./queue";
import { getOrCreateOpsState } from "./repository";

export async function getAnalyticsMetricsSnapshot() {
  const [ops, queue, cache] = await Promise.all([
    getOrCreateOpsState(),
    getAnalyticsQueueStats(),
    Promise.resolve(analyticsCacheStats()),
  ]);

  const recentErrors = await prisma.analyticsOpsError.count({
    where: {
      provider: "google_analytics",
      createdAt: { gte: new Date(Date.now() - 24 * 3600_000) },
    },
  });

  return {
    catalogEventCount: ops.catalogEventCount ?? countCatalogEvents(),
    avgResponseMs: ops.avgResponseMs,
    errorsLast24h: recentErrors,
    lastHealthAt: ops.lastHealthAt?.toISOString() ?? null,
    lastSuccessAt: ops.lastSuccessAt?.toISOString() ?? null,
    lastErrorCode: ops.lastErrorCode,
    queue,
    cache,
    status: ops.status,
  };
}

/** Persiste métrica leve em SystemMetric (opcional, não é warehouse GA). */
export async function recordSystemMetric(metricKey: string, value: number, metadata?: object) {
  try {
    await prisma.systemMetric.create({
      data: {
        metricKey: metricKey.slice(0, 80),
        value,
        metadata: metadata ? (metadata as object) : undefined,
      },
    });
  } catch {
    /* best-effort */
  }
}
