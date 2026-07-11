import { prisma } from "@/lib/prisma";
import type { Prisma, UserRole } from "@prisma/client";
import type { AiModule } from "@/lib/ai/ai-config";

export type AiAuditDecision = "ALLOW" | "DENY" | "REVIEW" | "DRAFT" | "CONFIRM_REQUIRED" | "EXECUTED";

export async function writeAiAuditLog(input: {
  userId?: string | null;
  role?: UserRole | string | null;
  module: AiModule | string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  decision: AiAuditDecision;
  metadata?: Record<string, unknown>;
}) {
  const safeMeta = sanitizeMetadata(input.metadata);
  try {
    await prisma.aIAuditLog.create({
      data: {
        userId: input.userId ?? null,
        role: input.role ? String(input.role) : null,
        module: String(input.module),
        action: input.action,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        decision: input.decision,
        metadata: (safeMeta ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch {
    // auditoria best-effort
  }
}

function sanitizeMetadata(meta?: Record<string, unknown>) {
  if (!meta) return null;
  const blocked = /key|secret|password|token|authorization|api[_-]?key/i;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (blocked.test(k)) continue;
    if (typeof v === "string" && v.length > 2000) {
      out[k] = `${v.slice(0, 2000)}…`;
    } else {
      out[k] = v;
    }
  }
  return out;
}
