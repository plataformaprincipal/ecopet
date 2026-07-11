import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";
import type { AiModule } from "@/lib/ai/ai-config";
import { estimateCostUsd } from "@/lib/ai/ai-config";

export type RecordAiUsageInput = {
  userId: string;
  role: UserRole | string;
  module: AiModule | string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  requestId?: string;
  success: boolean;
  errorCode?: string | null;
};

export async function recordAiUsage(input: RecordAiUsageInput) {
  const estimatedCost = estimateCostUsd(input.model, input.inputTokens, input.outputTokens);
  try {
    await prisma.aIUsage.create({
      data: {
        userId: input.userId,
        role: String(input.role),
        module: String(input.module),
        model: input.model,
        inputTokens: input.inputTokens,
        outputTokens: input.outputTokens,
        estimatedCost,
        requestId: input.requestId,
        success: input.success,
        errorCode: input.errorCode ?? null,
      },
    });
  } catch {
    // Mantém compatibilidade com AITokenUsage legado
    await prisma.aITokenUsage.create({
      data: {
        userId: input.userId,
        tokensInput: input.inputTokens,
        tokensOutput: input.outputTokens,
        estimatedCost,
        project: String(input.module),
      },
    }).catch(() => undefined);
  }
  return { estimatedCost };
}

export async function getDailyUsage(userId: string) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  try {
    const rows = await prisma.aIUsage.findMany({
      where: { userId, createdAt: { gte: start } },
      select: { inputTokens: true, outputTokens: true, estimatedCost: true, success: true },
    });
    return summarize(rows.map((r) => ({
      input: r.inputTokens,
      output: r.outputTokens,
      cost: r.estimatedCost,
      success: r.success,
    })));
  } catch {
    const rows = await prisma.aITokenUsage.findMany({
      where: { userId, createdAt: { gte: start } },
      select: { tokensInput: true, tokensOutput: true, estimatedCost: true },
    });
    return summarize(rows.map((r) => ({
      input: r.tokensInput,
      output: r.tokensOutput,
      cost: r.estimatedCost,
      success: true,
    })));
  }
}

export async function getAdminUsageStats(from: Date, to: Date) {
  try {
    const rows = await prisma.aIUsage.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: {
        module: true,
        role: true,
        inputTokens: true,
        outputTokens: true,
        estimatedCost: true,
        success: true,
        errorCode: true,
        userId: true,
        createdAt: true,
      },
    });
    const byModule: Record<string, number> = {};
    const byRole: Record<string, number> = {};
    const byUser: Record<string, number> = {};
    let errors = 0;
    let cost = 0;
    for (const r of rows) {
      byModule[r.module] = (byModule[r.module] ?? 0) + 1;
      byRole[r.role] = (byRole[r.role] ?? 0) + 1;
      if (r.userId) byUser[r.userId] = (byUser[r.userId] ?? 0) + 1;
      if (!r.success) errors += 1;
      cost += r.estimatedCost;
    }
    return {
      total: rows.length,
      errors,
      estimatedCostUsd: cost,
      byModule,
      byRole,
      topUsers: Object.entries(byUser)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([userId, count]) => ({ userId, count })),
    };
  } catch {
    return { total: 0, errors: 0, estimatedCostUsd: 0, byModule: {}, byRole: {}, topUsers: [] };
  }
}

function summarize(rows: { input: number; output: number; cost: number; success: boolean }[]) {
  return {
    requests: rows.length,
    successful: rows.filter((r) => r.success).length,
    inputTokens: rows.reduce((s, r) => s + r.input, 0),
    outputTokens: rows.reduce((s, r) => s + r.output, 0),
    estimatedCostUsd: rows.reduce((s, r) => s + r.cost, 0),
  };
}
