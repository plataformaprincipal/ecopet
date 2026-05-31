import { prisma } from "@ecopet/database";
import { assignSlaOnCreate } from "./sla-service.js";
import { emitPlatformEvent } from "./platform-governance-service.js";
import { createAuditLog } from "./audit-service.js";

const CRITICAL_REASONS = ["violencia", "violência", "abuso", "fraude", "ilegal", "critical", "critico", "crítico", "spam_massivo"];

export function isCriticalReport(reason: string, description?: string) {
  const text = `${reason} ${description ?? ""}`.toLowerCase();
  return CRITICAL_REASONS.some((k) => text.includes(k));
}

export async function createContentReport(params: {
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
  description?: string;
}) {
  const critical = isCriticalReport(params.reason, params.description);

  const report = await prisma.contentReport.create({
    data: {
      reporterId: params.reporterId,
      targetType: params.targetType,
      targetId: params.targetId,
      reason: params.reason,
      description: params.description,
      aiFlags: critical ? { severity: "critical", autoPrioritized: true } : { severity: "normal" },
    },
    include: { reporter: { select: { id: true, name: true, email: true } } },
  });

  await assignSlaOnCreate({
    entityType: "content_report",
    entityId: report.id,
    personaScope: "GESTOR",
    isCritical: critical,
    actorId: params.reporterId,
    metadata: { reason: params.reason, targetType: params.targetType },
  });

  const eventType = critical ? "report.critical" : "report.created";
  await emitPlatformEvent({
    eventType,
    personaScope: "GESTOR",
    actorId: params.reporterId,
    entityType: "content_report",
    entityId: report.id,
    payload: { reason: params.reason, critical, targetType: params.targetType },
    severity: critical ? "high" : "info",
  });

  await createAuditLog({
    userId: params.reporterId,
    action: "CREATE",
    module: "moderation",
    resource: "content_report",
    resourceId: report.id,
    metadata: { critical, reason: params.reason },
  });

  return report;
}
