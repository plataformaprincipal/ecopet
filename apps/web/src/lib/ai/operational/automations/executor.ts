/**
 * Executor de automações IA — eventos → notificação in-app + AIJob + auditoria.
 * Não envia e-mail/push de teste em produção sem preferências do usuário.
 */
import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications/notification-service";
import { writeAiAuditLog } from "@/lib/ai/ai-audit";
import { isAiFlagEnabled } from "../feature-flags";
import {
  getAutomationRule,
  listRulesForEvent,
  type AutomationEventType,
  type AutomationRule,
} from "./registry";

export type AutomationEventPayload = {
  event: AutomationEventType;
  userId?: string;
  role?: string;
  entityType?: string;
  entityId?: string;
  title?: string;
  message?: string;
  metadata?: Record<string, unknown>;
  /** Idempotency key — evita disparos repetidos na janela de 24h */
  dedupeKey?: string;
};

export type AutomationRunResult = {
  ruleId: string;
  status: "executed" | "skipped" | "failed";
  reason?: string;
  jobId?: string;
  notificationId?: string | null;
};

async function wasRecentlyExecuted(dedupeKey: string): Promise<boolean> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const existing = await prisma.aIJob.findFirst({
    where: {
      type: "AI_AUTOMATION",
      createdAt: { gte: since },
      payload: { path: ["dedupeKey"], equals: dedupeKey },
    },
    select: { id: true },
  });
  return Boolean(existing);
}

async function executeRule(
  rule: AutomationRule,
  payload: AutomationEventPayload
): Promise<AutomationRunResult> {
  if (!isAiFlagEnabled(rule.enabledByFlag)) {
    return { ruleId: rule.id, status: "skipped", reason: "flag_disabled" };
  }

  if (rule.requiresConfirmation) {
    return { ruleId: rule.id, status: "skipped", reason: "confirmation_required" };
  }

  const dedupeKey =
    payload.dedupeKey ??
    `${rule.id}:${payload.userId ?? "system"}:${payload.entityId ?? "na"}`;

  if (await wasRecentlyExecuted(dedupeKey)) {
    return { ruleId: rule.id, status: "skipped", reason: "deduped" };
  }

  const jobPayload: Prisma.InputJsonValue = {
    ruleId: rule.id,
    event: payload.event,
    dedupeKey,
    entityType: payload.entityType ?? null,
    entityId: payload.entityId ?? null,
    channels: rule.channels,
    metadata: (payload.metadata ?? {}) as Prisma.InputJsonValue,
  };

  const job = await prisma.aIJob.create({
    data: {
      userId: payload.userId ?? null,
      role: payload.role ?? null,
      type: "AI_AUTOMATION",
      status: "RUNNING",
      startedAt: new Date(),
      payload: jobPayload,
    },
  });

  try {
    let notificationId: string | null = null;

    if (payload.userId && rule.channels.includes("in_app")) {
      const notifType =
        payload.event.startsWith("order") || payload.event.startsWith("cart") || payload.event.startsWith("payment")
          ? "ORDER"
          : payload.event.startsWith("appointment") || payload.event.startsWith("vaccine")
            ? "APPOINTMENT"
            : payload.event.startsWith("stock")
              ? "PRODUCT"
              : "SECURITY";
      const row = await createNotification({
        userId: payload.userId,
        type: notifType,
        title: payload.title ?? rule.name,
        message: payload.message ?? rule.description,
        priority: rule.risk === "medium" || rule.risk === "high" ? "HIGH" : "NORMAL",
        actionUrl:
          typeof payload.metadata?.actionUrl === "string"
            ? payload.metadata.actionUrl
            : undefined,
        metadata: {
          automationRuleId: rule.id,
          event: payload.event,
          ...(payload.metadata ?? {}),
        },
      });
      notificationId = row?.id ?? null;
    }

    await prisma.aIJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        finishedAt: new Date(),
        result: {
          notificationId,
          channels: rule.channels,
        },
      },
    });

    await writeAiAuditLog({
      userId: payload.userId,
      role: payload.role,
      module: "automations",
      action: `automation.${rule.id}`,
      entityType: payload.entityType,
      entityId: payload.entityId,
      decision: "EXECUTED",
      metadata: { event: payload.event, jobId: job.id, notificationId },
    });

    return { ruleId: rule.id, status: "executed", jobId: job.id, notificationId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "automation_failed";
    await prisma.aIJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        error: message.slice(0, 500),
        attempts: { increment: 1 },
      },
    });
    return { ruleId: rule.id, status: "failed", reason: message, jobId: job.id };
  }
}

/** Dispara todas as regras elegíveis para o evento. */
export async function processAutomationEvent(
  payload: AutomationEventPayload
): Promise<AutomationRunResult[]> {
  if (!isAiFlagEnabled("automations") && !isAiFlagEnabled("smart_notifications")) {
    return [];
  }

  const rules = listRulesForEvent(payload.event);
  const results: AutomationRunResult[] = [];
  for (const rule of rules) {
    results.push(await executeRule(rule, payload));
  }
  return results;
}

/** Execução manual (admin) de uma regra específica. */
export async function runAutomationRuleById(
  ruleId: string,
  payload: Omit<AutomationEventPayload, "event"> & { event?: AutomationEventType }
): Promise<AutomationRunResult> {
  const rule = getAutomationRule(ruleId);
  if (!rule) return { ruleId, status: "failed", reason: "rule_not_found" };
  return executeRule(rule, { ...payload, event: payload.event ?? rule.event });
}

export async function listRecentAutomationJobs(limit = 20) {
  return prisma.aIJob.findMany({
    where: { type: "AI_AUTOMATION" },
    orderBy: { createdAt: "desc" },
    take: Math.min(50, Math.max(1, limit)),
    select: {
      id: true,
      userId: true,
      status: true,
      payload: true,
      result: true,
      error: true,
      createdAt: true,
      finishedAt: true,
    },
  });
}
