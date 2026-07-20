import "server-only";

import { prisma } from "@/lib/prisma";
import { enqueueJob } from "@/lib/jobs/job-queue";

/**
 * Abstração de fila analytics — reutiliza JobQueue existente.
 * Não introduz Bull/Redis.
 */
export async function enqueueAnalyticsJob(
  type: "ANALYTICS_HEALTH_CHECK" | "ANALYTICS_DIAGNOSTICS_REFRESH",
  payload: Record<string, unknown> = {}
) {
  return enqueueJob({
    type,
    payload: { provider: "google_analytics", ...payload },
  });
}

export async function getAnalyticsQueueStats() {
  const [pending, failed, retrying] = await Promise.all([
    prisma.jobQueue.count({
      where: {
        type: { in: ["ANALYTICS_HEALTH_CHECK", "ANALYTICS_DIAGNOSTICS_REFRESH"] },
        status: "PENDING",
      },
    }),
    prisma.jobQueue.count({
      where: {
        type: { in: ["ANALYTICS_HEALTH_CHECK", "ANALYTICS_DIAGNOSTICS_REFRESH"] },
        status: "FAILED",
      },
    }),
    prisma.jobQueue.count({
      where: {
        type: { in: ["ANALYTICS_HEALTH_CHECK", "ANALYTICS_DIAGNOSTICS_REFRESH"] },
        status: "RETRYING",
      },
    }),
  ]);
  return {
    supported: true,
    pending,
    failed,
    retrying,
    backend: "JobQueue",
  };
}

export async function reprocessFailedAnalyticsJobs(limit = 10) {
  const failed = await prisma.jobQueue.findMany({
    where: {
      type: { in: ["ANALYTICS_HEALTH_CHECK", "ANALYTICS_DIAGNOSTICS_REFRESH"] },
      status: "FAILED",
    },
    orderBy: { updatedAt: "desc" },
    take: Math.min(50, limit),
    select: { id: true },
  });
  let requeued = 0;
  for (const job of failed) {
    await prisma.jobQueue.update({
      where: { id: job.id },
      data: { status: "PENDING", scheduledAt: new Date(), lastError: null },
    });
    requeued += 1;
  }
  return { requeued };
}
