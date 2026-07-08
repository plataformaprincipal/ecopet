import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { writeAuditLog } from "@/lib/audit-log";
import { createNotification } from "@/lib/notifications/notification-service";
import { sendPlatformEmail } from "@/lib/email/provider";
import { enqueueJob } from "@/lib/jobs/job-queue";
import { runOrchestrator } from "@/lib/ai/orchestrator";
import { isAIProviderConfigured } from "@/lib/ai/provider";
import type { WorkflowAction } from "./workflow-types";

export async function executeWorkflowAction(
  instanceId: string,
  action: WorkflowAction,
  ctx: Record<string, unknown>
) {
  const step = action.type;
  let status = "COMPLETED";
  let message = action.label ?? step;
  let error: string | undefined;

  try {
    switch (action.type) {
      case "create_audit_log":
        await writeAuditLog({
          actorId: (ctx.actorId as string) ?? undefined,
          action: "CREATE",
          module: "platform.workflow",
          resource: String(action.config?.resource ?? "Workflow"),
          resourceId: instanceId,
          observation: String(action.config?.observation ?? message),
          metadata: { eventType: ctx.type, ...action.config },
        });
        break;
      case "send_notification": {
        const userId = String(action.config?.userId ?? ctx.actorId ?? "");
        if (userId) {
          await createNotification({
            userId,
            type: "SYSTEM",
            title: String(action.config?.title ?? "Notificação EcoPet"),
            message: String(action.config?.message ?? message),
            metadata: { workflowInstanceId: instanceId, ...action.config },
          });
          await prisma.notificationEvent.create({
            data: {
              userId,
              channel: "in_app",
              title: String(action.config?.title ?? "Notificação"),
              body: String(action.config?.message ?? message),
              status: "sent",
              sentAt: new Date(),
              metadata: { instanceId },
            },
          });
        }
        break;
      }
      case "send_email": {
        const to = String(action.config?.to ?? ctx.email ?? "");
        if (to) {
          await sendPlatformEmail({
            event: "ORDER_CONFIRMED",
            to,
            subject: String(action.config?.subject ?? "EcoPet"),
            text: String(action.config?.text ?? message),
            html: String(action.config?.html ?? `<p>${message}</p>`),
          }).catch(() => undefined);
          await enqueueJob({ type: "SEND_EMAIL", payload: { to, subject: action.config?.subject } });
        }
        break;
      }
      case "create_task":
        await prisma.internalTask.create({
          data: {
            title: String(action.config?.title ?? message),
            description: action.config?.description ? String(action.config.description) : undefined,
            sourceType: String(ctx.entityType ?? "workflow"),
            sourceId: String(ctx.entityId ?? instanceId),
            createdById: (ctx.actorId as string) ?? undefined,
            metadata: { instanceId, eventType: String(ctx.type ?? "") },
          },
        });
        break;
      case "create_ticket":
        await enqueueJob({
          type: "RUN_WORKFLOW",
          payload: { action: "create_support_ticket", config: action.config, ctx },
        });
        break;
      case "call_ai":
        if (isAIProviderConfigured()) {
          const agentId = (action.config?.agentId as "admin" | "finance" | "marketing" | "support") ?? "admin";
          await runOrchestrator({
            userId: (ctx.actorId as string) ?? "system",
            role: "ADMIN",
            agentId,
            message: String(action.config?.prompt ?? `Evento ${ctx.type}: ${JSON.stringify(ctx.payload ?? {})}`),
            metadata: { workflowInstanceId: instanceId },
          });
        } else {
          status = "SKIPPED";
          message = "IA não configurada";
        }
        break;
      case "call_webhook":
        await enqueueJob({ type: "SYNC_INTEGRATION", payload: { webhook: action.config, ctx } });
        break;
      case "reprocess_job":
        if (action.config?.jobId) {
          await enqueueJob({ type: "REPROCESS_FAILED_JOB", payload: { jobId: action.config.jobId } });
        }
        break;
      default:
        status = "SKIPPED";
        message = `Ação ${step} registrada`;
    }
  } catch (e) {
    status = "FAILED";
    error = (e as Error).message;
    if (!action.continueOnError) throw e;
  }

  await prisma.workflowExecutionLog.create({
    data: {
      instanceId,
      step,
      status,
      message: error ? `${message}: ${error}` : message,
      metadata: JSON.parse(JSON.stringify({ config: action.config, ctx: { type: ctx.type, entityId: ctx.entityId } })) as Prisma.InputJsonValue,
    },
  });
}
