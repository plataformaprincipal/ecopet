import { prisma } from "@ecopet/database";
import type { PersonaScope, TicketPriority } from "@prisma/client";
import { createAuditLog } from "./audit-service.js";
import { emitPlatformEvent } from "./platform-governance-service.js";

const PRIORITY_MULTIPLIER: Record<string, number> = {
  URGENT: 0.25,
  HIGH: 0.5,
  MEDIUM: 1,
  LOW: 1.25,
};

export async function findSlaPolicy(entityType: string, personaScope?: PersonaScope, isCritical?: boolean) {
  const policies = await prisma.slaPolicy.findMany({
    where: {
      entityType,
      isActive: true,
      ...(personaScope ? { OR: [{ personaScope }, { personaScope: "GLOBAL" }] } : {}),
    },
    orderBy: { responseMins: isCritical ? "asc" : "desc" },
  });
  if (isCritical) {
    return policies.find((p) => p.name.toLowerCase().includes("crít") || p.name.toLowerCase().includes("crit")) ?? policies[0];
  }
  return policies.find((p) => !p.name.toLowerCase().includes("crít") && !p.name.toLowerCase().includes("crit")) ?? policies[0];
}

export async function assignSlaOnCreate(params: {
  entityType: string;
  entityId: string;
  priority?: TicketPriority | string;
  personaScope?: PersonaScope;
  isCritical?: boolean;
  actorId?: string;
  metadata?: Record<string, unknown>;
}) {
  const existing = await prisma.slaRecord.findFirst({
    where: { entityType: params.entityType, entityId: params.entityId, status: "ACTIVE" },
  });
  if (existing) return existing;

  let policy = await findSlaPolicy(params.entityType, params.personaScope, params.isCritical);
  if (!policy && params.isCritical) {
    policy = await findSlaPolicy(params.entityType, params.personaScope, true);
  }
  if (!policy) return null;

  const multiplier = params.isCritical ? 0.5 : PRIORITY_MULTIPLIER[params.priority ?? "MEDIUM"] ?? 1;
  const responseMins = Math.max(5, Math.round(policy.responseMins * multiplier));
  const resolutionMins = Math.max(15, Math.round(policy.resolutionMins * multiplier));
  const now = Date.now();
  const responseDueAt = new Date(now + responseMins * 60 * 1000);
  const resolutionDueAt = new Date(now + resolutionMins * 60 * 1000);

  const record = await prisma.slaRecord.create({
    data: {
      policyId: policy.id,
      entityType: params.entityType,
      entityId: params.entityId,
      dueAt: resolutionDueAt,
      metadata: {
        responseDueAt: responseDueAt.toISOString(),
        resolutionDueAt: resolutionDueAt.toISOString(),
        responseMins,
        resolutionMins,
        priority: params.priority,
        isCritical: params.isCritical,
        policyName: policy.name,
        ...params.metadata,
      },
    },
  });

  await emitPlatformEvent({
    eventType: `${params.entityType.replace("_", ".")}.sla_assigned`,
    personaScope: params.personaScope ?? "GLOBAL",
    actorId: params.actorId,
    entityType: params.entityType,
    entityId: params.entityId,
    payload: { slaRecordId: record.id, responseDueAt, resolutionDueAt, policyName: policy.name },
  });

  await createAuditLog({
    userId: params.actorId,
    action: "CREATE",
    module: "sla",
    resource: "sla_record",
    resourceId: record.id,
    metadata: { entityType: params.entityType, entityId: params.entityId },
    observation: `SLA "${policy.name}" aplicado automaticamente`,
  });

  return record;
}

export async function markSlaResponded(entityType: string, entityId: string, userId?: string) {
  const record = await prisma.slaRecord.findFirst({
    where: { entityType, entityId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
  if (!record || record.respondedAt) return record;

  const meta = (record.metadata as Record<string, unknown>) ?? {};
  const responseDueAt = meta.responseDueAt ? new Date(String(meta.responseDueAt)) : null;
  const breached = responseDueAt && responseDueAt < new Date();

  const updated = await prisma.slaRecord.update({
    where: { id: record.id },
    data: {
      respondedAt: new Date(),
      metadata: { ...meta, responseBreached: breached },
    },
  });

  if (breached) {
    await emitPlatformEvent({
      eventType: "sla.response_breached",
      entityType,
      entityId,
      actorId: userId,
      payload: { slaRecordId: record.id },
      severity: "warn",
    });
  }

  return updated;
}

export async function markSlaResolved(entityType: string, entityId: string, userId?: string) {
  const record = await prisma.slaRecord.findFirst({
    where: { entityType, entityId, status: { in: ["ACTIVE", "BREACHED"] } },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return null;

  const met = record.dueAt >= new Date();
  const updated = await prisma.slaRecord.update({
    where: { id: record.id },
    data: {
      resolvedAt: new Date(),
      status: met ? "MET" : "BREACHED",
      ...(met ? {} : { breachedAt: new Date() }),
    },
  });

  await createAuditLog({
    userId,
    action: "UPDATE",
    module: "sla",
    resource: "sla_record",
    resourceId: record.id,
    observation: met ? "SLA cumprido na resolução" : "SLA violado na resolução",
  });

  return updated;
}

export async function syncSlaBreaches() {
  const now = new Date();
  const overdue = await prisma.slaRecord.findMany({
    where: { status: "ACTIVE", dueAt: { lt: now } },
  });

  for (const record of overdue) {
    await prisma.slaRecord.update({
      where: { id: record.id },
      data: { status: "BREACHED", breachedAt: now },
    });
    await emitPlatformEvent({
      eventType: "sla.breached",
      entityType: record.entityType,
      entityId: record.entityId,
      payload: { slaRecordId: record.id },
      severity: "high",
    });
  }

  const active = await prisma.slaRecord.findMany({ where: { status: "ACTIVE" } });
  for (const record of active) {
    const meta = (record.metadata as Record<string, unknown>) ?? {};
    const responseDueAt = meta.responseDueAt ? new Date(String(meta.responseDueAt)) : null;
    if (responseDueAt && responseDueAt < now && !record.respondedAt) {
      await emitPlatformEvent({
        eventType: "sla.response_overdue",
        entityType: record.entityType,
        entityId: record.entityId,
        payload: { slaRecordId: record.id },
        severity: "warn",
      });
    }
  }

  return overdue.length;
}

export async function getSlaForEntity(entityType: string, entityId: string) {
  return prisma.slaRecord.findFirst({
    where: { entityType, entityId },
    orderBy: { createdAt: "desc" },
    include: { policy: true },
  });
}

export async function getSlaRecordsWithEntities(limit = 30) {
  const records = await prisma.slaRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { policy: true },
  });

  const enriched = await Promise.all(
    records.map(async (r) => {
      let entityLabel = r.entityId;
      if (r.entityType === "support_ticket") {
        const t = await prisma.supportTicket.findUnique({ where: { id: r.entityId }, select: { number: true, subject: true } });
        if (t) entityLabel = `#${t.number} ${t.subject}`;
      }
      if (r.entityType === "content_report") {
        const rep = await prisma.contentReport.findUnique({ where: { id: r.entityId }, select: { reason: true, targetType: true } });
        if (rep) entityLabel = `${rep.targetType}: ${rep.reason}`;
      }
      return { ...r, entityLabel };
    })
  );

  return enriched;
}
