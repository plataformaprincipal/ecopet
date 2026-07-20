import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { FirewallResult, SecurityCategory, SecuritySeverity } from "./types";

export async function recordSecurityEvent(input: {
  userId?: string;
  category: SecurityCategory | string;
  severity: SecuritySeverity;
  decision: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.aISecurityEvent
    .create({
      data: {
        userId: input.userId ?? null,
        category: input.category,
        severity: input.severity,
        decision: input.decision,
        reason: input.reason?.slice(0, 500) ?? null,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    })
    .catch(() => undefined);
}

export async function recordFirewallEvent(
  userId: string | undefined,
  result: FirewallResult
): Promise<void> {
  if (result.decision === "ALLOW") return;
  for (const category of result.categories.length ? result.categories : ["sensitive_input"]) {
    await recordSecurityEvent({
      userId,
      category,
      severity: result.severity,
      decision: result.decision,
      reason: result.reason,
    });
  }
}

export async function listRecentSecurityEvents(limit = 50) {
  return prisma.aISecurityEvent
    .findMany({
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 200),
      select: {
        id: true,
        userId: true,
        category: true,
        severity: true,
        decision: true,
        reason: true,
        createdAt: true,
      },
    })
    .catch(() => []);
}
