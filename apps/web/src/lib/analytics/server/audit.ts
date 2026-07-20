import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { analyticsServerLog } from "./logger";

export async function writeAnalyticsAudit(input: {
  userId: string;
  action: "VIEW" | "UPDATE" | "CREATE" | "DELETE" | "EXPORT";
  resource: string;
  status?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        module: "admin-analytics",
        resource: input.resource,
        status: input.status ?? "success",
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
    analyticsServerLog("AUDIT", `${input.action} ${input.resource}`, {
      userId: input.userId.slice(0, 8),
    });
  } catch {
    /* best-effort */
  }
}
