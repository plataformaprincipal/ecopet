import { writeAuditLog } from "@/lib/audit-log";
import { emitPlatformEvent, PLATFORM_EVENTS } from "@/lib/events/event-bus";
import { completeJob, failJob } from "./job-queue";
import type { JobType } from "./job-types";

type JobRecord = {
  id: string;
  type: string;
  payload: unknown;
};

const handlers: Partial<Record<JobType, (job: JobRecord) => Promise<void>>> = {
  SEND_EMAIL: async (job) => {
    await writeAuditLog({
      action: "CREATE",
      module: "platform.jobs",
      resource: "Email",
      resourceId: job.id,
      observation: "Job de e-mail processado",
      metadata: job.payload as Record<string, unknown>,
    });
  },
  SEND_NOTIFICATION: async (job) => {
    await writeAuditLog({
      action: "CREATE",
      module: "platform.jobs",
      resource: "Notification",
      resourceId: job.id,
      metadata: job.payload as Record<string, unknown>,
    });
  },
  PROCESS_PAYMENT_WEBHOOK: async (job) => {
    await writeAuditLog({
      action: "SYNC",
      module: "platform.webhooks",
      resource: "WebhookEvent",
      resourceId: String((job.payload as { webhookEventId?: string }).webhookEventId ?? job.id),
      observation: "Webhook de pagamento processado",
    });
  },
  REPROCESS_FAILED_JOB: async (job) => {
    const jobId = String((job.payload as { jobId?: string }).jobId ?? "");
    if (jobId) await processJobById(jobId);
  },
};

export async function processJobById(jobId: string) {
  const { prisma } = await import("@/lib/prisma");
  const job = await prisma.jobQueue.findUnique({ where: { id: jobId } });
  if (!job) return;
  await runJob(job);
}

export async function runJob(job: JobRecord) {
  const handler = handlers[job.type as JobType];
  try {
    if (handler) await handler(job);
    else {
      await writeAuditLog({
        action: "UPDATE",
        module: "platform.jobs",
        resource: "JobQueue",
        resourceId: job.id,
        observation: `Job ${job.type} executado (handler genérico)`,
      });
    }
    await completeJob(job.id);
  } catch (e) {
    const msg = (e as Error).message;
    await failJob(job.id, msg);
    await emitPlatformEvent({
      type: PLATFORM_EVENTS.JOB_FAILED,
      entityType: "JobQueue",
      entityId: job.id,
      payload: { error: msg, jobType: job.type },
      severity: "high",
    });
  }
}

export async function processPendingJobs(limit = 10) {
  const { claimNextJob } = await import("./job-queue");
  for (let i = 0; i < limit; i++) {
    const job = await claimNextJob();
    if (!job) break;
    await runJob(job);
  }
}
