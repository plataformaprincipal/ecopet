import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import type { AuditAction, Prisma } from "@prisma/client";

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export function partnerErpSessionType(partnerId: string, module: string) {
  return `partner:erp:${module}:${partnerId}`;
}

export async function loadPartnerErpStore<T>(
  partnerId: string,
  module: string,
  fallback: T
): Promise<T> {
  const session = await prisma.aiSession.findFirst({
    where: { userId: partnerId, type: partnerErpSessionType(partnerId, module) },
    orderBy: { updatedAt: "desc" },
  });
  if (!session?.messages) return fallback;
  return { ...fallback, ...(session.messages as object) } as T;
}

export async function savePartnerErpStore<T extends Record<string, unknown>>(
  partnerId: string,
  module: string,
  data: T
): Promise<void> {
  const type = partnerErpSessionType(partnerId, module);
  const existing = await prisma.aiSession.findFirst({
    where: { userId: partnerId, type },
    orderBy: { updatedAt: "desc" },
  });
  if (existing) {
    await prisma.aiSession.update({ where: { id: existing.id }, data: { messages: toJson(data) } });
  } else {
    await prisma.aiSession.create({ data: { userId: partnerId, type, messages: toJson(data) } });
  }
}

export async function auditPartnerErp(params: {
  actorId: string;
  partnerId: string;
  module: string;
  resource: string;
  action: AuditAction;
  resourceId?: string;
  entityBefore?: unknown;
  entityAfter?: unknown;
  observation?: string;
}) {
  await writeAuditLog({
    actorId: params.actorId,
    action: params.action,
    module: `partner-erp:${params.module}`,
    resource: params.resource,
    resourceId: params.resourceId,
    entityBefore: params.entityBefore,
    entityAfter: params.entityAfter,
    observation: params.observation,
    metadata: { partnerId: params.partnerId },
  });
}

export async function loadPartnerAuditTrail(partnerId: string, module: string, limit = 15) {
  const logs = await prisma.auditLog.findMany({
    where: { module: `partner-erp:${module}` },
    orderBy: { createdAt: "desc" },
    take: limit * 3,
    include: { actor: { select: { name: true } } },
  });
  return logs
    .filter((l) => {
      const meta = l.metadata as { partnerId?: string } | null;
      return !meta?.partnerId || meta.partnerId === partnerId;
    })
    .slice(0, limit)
    .map((l) => ({
      id: l.id,
      action: l.action,
      resource: l.resource,
      observation: l.observation,
      actor: l.actor?.name ?? "Sistema",
      createdAt: l.createdAt.toISOString(),
    }));
}
