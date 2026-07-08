import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import type { AuditAction, Prisma } from "@prisma/client";

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export function ngoErpSessionType(ongId: string, module: string) {
  return `ngo:erp:${module}:${ongId}`;
}

export async function loadNgoErpStore<T>(ongId: string, module: string, fallback: T): Promise<T> {
  const session = await prisma.aiSession.findFirst({
    where: { userId: ongId, type: ngoErpSessionType(ongId, module) },
    orderBy: { updatedAt: "desc" },
  });
  if (!session?.messages) return fallback;
  return { ...fallback, ...(session.messages as object) } as T;
}

export async function saveNgoErpStore<T extends Record<string, unknown>>(
  ongId: string,
  module: string,
  data: T
): Promise<void> {
  const type = ngoErpSessionType(ongId, module);
  const existing = await prisma.aiSession.findFirst({
    where: { userId: ongId, type },
    orderBy: { updatedAt: "desc" },
  });
  if (existing) {
    await prisma.aiSession.update({ where: { id: existing.id }, data: { messages: toJson(data) } });
  } else {
    await prisma.aiSession.create({ data: { userId: ongId, type, messages: toJson(data) } });
  }
}

export async function auditNgoErp(params: {
  actorId: string;
  ongId: string;
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
    module: `ngo-erp:${params.module}`,
    resource: params.resource,
    resourceId: params.resourceId,
    entityBefore: params.entityBefore,
    entityAfter: params.entityAfter,
    observation: params.observation,
    metadata: { ongId: params.ongId },
  });
}

export async function loadNgoAuditTrail(ongId: string, module: string, limit = 15) {
  const logs = await prisma.auditLog.findMany({
    where: { module: `ngo-erp:${module}` },
    orderBy: { createdAt: "desc" },
    take: limit * 3,
    include: { actor: { select: { name: true } } },
  });
  return logs
    .filter((l) => {
      const meta = l.metadata as { ongId?: string } | null;
      return !meta?.ongId || meta.ongId === ongId;
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
