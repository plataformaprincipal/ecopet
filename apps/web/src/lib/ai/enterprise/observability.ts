import "server-only";

import { prisma } from "@/lib/prisma";
import { listRecentSecurityEvents } from "./security-events";
import { listRecentToolExecutions } from "./tool-execution-log";

export async function getEnterpriseObservability() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [usage, tools, security, failures] = await Promise.all([
    prisma.aIUsage
      .findMany({
        where: { createdAt: { gte: since } },
        select: {
          inputTokens: true,
          outputTokens: true,
          estimatedCost: true,
          success: true,
          model: true,
          module: true,
        },
        take: 20_000,
      })
      .catch(() => []),
    listRecentToolExecutions(30),
    listRecentSecurityEvents(30),
    prisma.aIUsage.count({ where: { createdAt: { gte: since }, success: false } }).catch(() => 0),
  ]);

  const latencies = tools.map((t) => t.latencyMs);
  const avgToolLatency =
    latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;

  const tokens = usage.reduce((s, r) => s + r.inputTokens + r.outputTokens, 0);
  const cost = usage.reduce((s, r) => s + (r.estimatedCost ?? 0), 0);
  const models = [...new Set(usage.map((u) => u.model))];

  return {
    windowHours: 24,
    requests: usage.length,
    failures,
    tokens,
    costUsd: cost,
    models,
    avgToolLatencyMs: avgToolLatency,
    toolsUsed: [...new Set(tools.map((t) => t.toolName))],
    recentTools: tools,
    recentSecurity: security,
    generatedAt: new Date().toISOString(),
  };
}
