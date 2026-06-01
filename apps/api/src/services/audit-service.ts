import { prisma } from "@ecopet/database";
import type { AuditAction } from "@prisma/client";
import { asOptionalInputJson } from "../lib/prisma-json.js";

export interface AuditEntry {
  userId?: string;
  action: AuditAction;
  module: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  observation?: string;
  entityBefore?: unknown;
  entityAfter?: unknown;
  riskLevel?: string;
  ip?: string;
  userAgent?: string;
}

export async function createAuditLog(entry: AuditEntry) {
  const metadata = {
    ...(entry.metadata ?? {}),
    ...(entry.observation ? { observation: entry.observation } : {}),
    ...(entry.entityBefore !== undefined ? { entityBefore: entry.entityBefore } : {}),
    ...(entry.riskLevel ? { riskLevel: entry.riskLevel } : {}),
  };

  const log = await prisma.auditLog.create({
    data: {
      userId: entry.userId,
      action: entry.action,
      module: entry.module,
      resource: entry.resource,
      resourceId: entry.resourceId,
      metadata: asOptionalInputJson(Object.keys(metadata).length ? metadata : undefined),
      ip: entry.ip,
      userAgent: entry.userAgent,
    },
  });

  import("./platform-governance-service.js").then(({ emitPlatformEvent }) =>
    emitPlatformEvent({
      eventType: `audit.${entry.action.toLowerCase()}`,
      actorId: entry.userId,
      entityType: entry.resource,
      entityId: entry.resourceId,
      payload: { module: entry.module, action: entry.action },
    }).catch(() => {})
  ).catch(() => {});

  return log;
}

export async function listAuditLogs(params: {
  module?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}) {
  const { module, userId, limit = 50, offset = 0 } = params;
  return prisma.auditLog.findMany({
    where: {
      ...(module ? { module } : {}),
      ...(userId ? { userId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
    include: {
      actor: { select: { id: true, name: true, email: true, role: true } },
    },
  });
}
