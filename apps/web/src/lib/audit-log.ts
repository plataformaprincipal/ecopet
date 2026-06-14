import { prisma } from "@/lib/prisma";
import type { AuditAction, Prisma } from "@prisma/client";

type AuditParams = {
  actorId?: string | null;
  action: AuditAction;
  module: string;
  resource: string;
  resourceId?: string;
  entityBefore?: unknown;
  entityAfter?: unknown;
  observation?: string;
  metadata?: Record<string, unknown>;
};

function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function writeAuditLog(params: AuditParams) {
  await prisma.auditLog.create({
    data: {
      userId: params.actorId ?? null,
      action: params.action,
      module: params.module,
      resource: params.resource,
      resourceId: params.resourceId,
      entityBefore: toJson(params.entityBefore),
      entityAfter: toJson(params.entityAfter),
      observation: params.observation,
      metadata: toJson(params.metadata),
    },
  });
}
