import "server-only";

import { prisma } from "@/lib/prisma";
import { getAdminUsageStats } from "@/lib/ai/ai-usage";

export type CostAlert = {
  level: "info" | "warning" | "critical";
  message: string;
};

async function tokenTotals(from: Date, to: Date) {
  const rows = await prisma.aIUsage
    .findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { inputTokens: true, outputTokens: true, estimatedCost: true },
      take: 50_000,
    })
    .catch(() => [] as Array<{ inputTokens: number; outputTokens: number; estimatedCost: number }>);
  return {
    tokens: rows.reduce((s, r) => s + r.inputTokens + r.outputTokens, 0),
    costUsd: rows.reduce((s, r) => s + (r.estimatedCost ?? 0), 0),
  };
}

export async function getEnterpriseCostDashboard() {
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [dailyStats, monthlyStats, dailyTok, monthlyTok, toolAgg] = await Promise.all([
    getAdminUsageStats(dayStart, now),
    getAdminUsageStats(monthStart, now),
    tokenTotals(dayStart, now),
    tokenTotals(monthStart, now),
    prisma.aIToolExecution
      .groupBy({
        by: ["toolName"],
        _count: { _all: true },
        _avg: { latencyMs: true },
        where: { createdAt: { gte: monthStart } },
      })
      .catch(
        () =>
          [] as Array<{
            toolName: string;
            _count: { _all: number };
            _avg: { latencyMs: number | null };
          }>
      ),
  ]);

  const byTool = Object.fromEntries(
    toolAgg.map((t) => [
      t.toolName,
      { count: t._count._all, avgLatencyMs: Math.round(t._avg.latencyMs ?? 0) },
    ])
  );

  const dailyBudget = Number(process.env.AI_DAILY_BUDGET_USD || 25);
  const monthlyBudget = Number(process.env.AI_MONTHLY_BUDGET_USD || 500);
  const alerts: CostAlert[] = [];

  if (dailyTok.costUsd >= dailyBudget * 0.8) {
    alerts.push({
      level: dailyTok.costUsd >= dailyBudget ? "critical" : "warning",
      message: `Consumo diário US$ ${dailyTok.costUsd.toFixed(4)} (limite ${dailyBudget}).`,
    });
  }
  if (monthlyTok.costUsd >= monthlyBudget * 0.8) {
    alerts.push({
      level: monthlyTok.costUsd >= monthlyBudget ? "critical" : "warning",
      message: `Consumo mensal US$ ${monthlyTok.costUsd.toFixed(4)} (limite ${monthlyBudget}).`,
    });
  }

  return {
    daily: {
      costUsd: dailyTok.costUsd,
      tokens: dailyTok.tokens,
      requests: dailyStats.total,
      errors: dailyStats.errors,
      byModule: dailyStats.byModule,
      byRole: dailyStats.byRole,
      topUsers: dailyStats.topUsers,
    },
    monthly: {
      costUsd: monthlyTok.costUsd,
      tokens: monthlyTok.tokens,
      requests: monthlyStats.total,
      errors: monthlyStats.errors,
      byModule: monthlyStats.byModule,
      byRole: monthlyStats.byRole,
      topUsers: monthlyStats.topUsers,
    },
    byTool,
    budgets: { dailyUsd: dailyBudget, monthlyUsd: monthlyBudget },
    alerts,
    generatedAt: new Date().toISOString(),
  };
}
