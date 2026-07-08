import { writeAuditLog } from "@/lib/audit-log";
import { enqueueJob } from "@/lib/jobs/job-queue";
import { runWorkflowsForEvent } from "@/lib/workflows/workflow-engine";
import { registerEventHandler, registerGlobalEventHandler } from "./event-registry";
import { PLATFORM_EVENTS } from "./event-types";

export function bootstrapDefaultEventHandlers() {
  registerEventHandler(PLATFORM_EVENTS.INTEGRATION_FAILED, async (event) => {
    await writeAuditLog({
      actorId: event.actorId,
      action: "CREATE",
      module: "platform.integrations",
      resource: "IntegrationFailure",
      resourceId: event.entityId,
      observation: String(event.payload?.message ?? "Falha de integração"),
      metadata: event.payload,
    });
  });

  registerEventHandler(PLATFORM_EVENTS.WEBHOOK_RECEIVED, async (event) => {
    await enqueueJob({
      type: "PROCESS_PAYMENT_WEBHOOK",
      payload: { webhookEventId: event.entityId, ...event.payload },
    });
  });

  registerEventHandler(PLATFORM_EVENTS.JOB_FAILED, async (event) => {
    await writeAuditLog({
      actorId: event.actorId,
      action: "UPDATE",
      module: "platform.jobs",
      resource: "JobQueue",
      resourceId: event.entityId,
      observation: String(event.payload?.error ?? "Job falhou"),
    });
  });

  registerGlobalEventHandler(async (event) => {
    await runWorkflowsForEvent(event.type, event);
  });
}

let bootstrapped = false;
export function ensureEventHandlers() {
  if (bootstrapped) return;
  bootstrapDefaultEventHandlers();
  bootstrapped = true;
}
