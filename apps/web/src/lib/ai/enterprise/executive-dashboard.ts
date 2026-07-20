/**
 * Dashboard Executivo IA — agregação única para produção.
 */
import "server-only";

import { prisma } from "@/lib/prisma";
import { AI_CONFIG } from "@/lib/ai/ai-config";
import { runAiFoundationHealth } from "@/lib/ai/foundation";
import { getEnterpriseCostDashboard } from "./cost-management";
import { getEnterpriseObservability } from "./observability";
import { listRecentSecurityEvents } from "./security-events";
import { FUNCTION_CALLING_READY } from "@/lib/ai/modules/function-calling";
import { getToolCatalogSnapshot } from "@/lib/ai/modules/tool-registry";

export async function getExecutiveAiDashboard() {
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    health,
    costs,
    obs,
    security,
    conversationsActive,
    conversationsMonth,
    messagesToday,
    distinctUsersMonth,
    latencySamples,
  ] = await Promise.all([
    runAiFoundationHealth(),
    getEnterpriseCostDashboard(),
    getEnterpriseObservability(),
    listRecentSecurityEvents(20),
    prisma.aIConversation
      .count({ where: { deletedAt: null, status: "ACTIVE" } })
      .catch(() => 0),
    prisma.aIConversation
      .count({ where: { deletedAt: null, createdAt: { gte: monthStart } } })
      .catch(() => 0),
    prisma.aIMessage.count({ where: { createdAt: { gte: dayStart } } }).catch(() => 0),
    prisma.aIUsage
      .findMany({
        where: { createdAt: { gte: monthStart }, userId: { not: null } },
        select: { userId: true },
        distinct: ["userId"],
        take: 10_000,
      })
      .then((rows) => rows.length)
      .catch(() => 0),
    prisma.aIMessage
      .findMany({
        where: { createdAt: { gte: dayStart }, latencyMs: { not: null } },
        select: { latencyMs: true },
        take: 5_000,
        orderBy: { createdAt: "desc" },
      })
      .catch(() => [] as Array<{ latencyMs: number | null }>),
  ]);

  const latencies = latencySamples
    .map((r) => r.latencyMs)
    .filter((n): n is number => typeof n === "number" && n >= 0)
    .sort((a, b) => a - b);

  const avgLatency =
    latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : obs.avgToolLatencyMs;
  const maxLatency = latencies.length ? latencies[latencies.length - 1]! : 0;
  const p95Latency =
    latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.95)]! : 0;

  const availability =
    health.status === "healthy"
      ? 99.9
      : health.status === "degraded"
        ? 95
        : health.status === "not_configured"
          ? 0
          : 80;

  type AlertRow = {
    type: "cost" | "security" | "reliability";
    level: "info" | "warning" | "critical";
    message: string;
  };

  const alerts: AlertRow[] = [
    ...costs.alerts.map((a) => ({
      type: "cost" as const,
      level: a.level,
      message: a.message,
    })),
    ...security
      .filter((s) => s.severity === "high" || s.severity === "critical")
      .slice(0, 5)
      .map((s) => ({
        type: "security" as const,
        level: (s.severity === "critical" ? "critical" : "warning") as AlertRow["level"],
        message: `${s.category}: ${s.decision}${s.reason ? ` — ${s.reason}` : ""}`,
      })),
  ];

  if (obs.failures > 20) {
    alerts.push({
      type: "reliability",
      level: "warning",
      message: `${obs.failures} falhas de uso nas últimas 24h.`,
    });
  }

  return {
    availability,
    health: {
      status: health.status,
      latencyMs: health.latencyMs,
      configured: AI_CONFIG.isConfigured,
    },
    kpis: {
      avgLatencyMs: avgLatency,
      maxLatencyMs: maxLatency,
      p95LatencyMs: p95Latency,
      errors24h: obs.failures,
      retriesNote: "Retry via withRetry (fundação)",
      tokensToday: costs.daily.tokens,
      tokensMonth: costs.monthly.tokens,
      costDailyUsd: costs.daily.costUsd,
      costMonthlyUsd: costs.monthly.costUsd,
      activeUsersMonth: distinctUsersMonth,
      conversationsActive,
      conversationsMonth,
      messagesToday,
      toolsRegistered: getToolCatalogSnapshot().length,
      toolsUsed24h: obs.toolsUsed.length,
      requests24h: obs.requests,
    },
    usageByModule: costs.monthly.byModule,
    usageByRole: costs.monthly.byRole,
    topUsers: costs.monthly.topUsers,
    byTool: costs.byTool,
    functionCalling: FUNCTION_CALLING_READY,
    budgets: costs.budgets,
    alerts,
    securityRecent: security.slice(0, 10),
    generatedAt: new Date().toISOString(),
  };
}
