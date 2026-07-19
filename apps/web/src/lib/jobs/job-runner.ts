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
    const payload = job.payload as {
      webhookEventId?: string;
      provider?: string;
    };
    const webhookEventId = String(payload.webhookEventId ?? "");
    const provider = String(payload.provider ?? "");

    // Mercado Pago: processamento canônico é síncrono em /api/webhooks/mercado-pago
    // (consulta API Orders). Job permanece para auditoria / reprocesso legado.
    if (provider === "mercado-pago" || provider === "mercado_pago") {
      const { prisma } = await import("@/lib/prisma");
      const event = webhookEventId
        ? await prisma.webhookEvent.findUnique({ where: { id: webhookEventId } })
        : null;
      if (event?.status === "PENDING" && event.externalId) {
        const { getMercadoPagoOrder } = await import("@/lib/mercado-pago/client");
        const { mapMpOrderStatusToInternal } = await import("@/lib/mercado-pago/status");
        const { applyInternalPaymentStatus } = await import(
          "@/lib/mercado-pago/apply-payment-status"
        );
        const remote = await getMercadoPagoOrder(event.externalId);
        if (remote.ok) {
          const payment = await prisma.payment.findFirst({
            where: {
              provider: "mercado_pago",
              OR: [{ providerOrderId: remote.data.id }, { externalId: remote.data.id }],
            },
          });
          if (payment) {
            await applyInternalPaymentStatus({
              paymentId: payment.id,
              internalStatus: mapMpOrderStatusToInternal(
                remote.data.status,
                remote.data.status_detail
              ),
              statusDetail: remote.data.status_detail,
              providerOrderId: remote.data.id,
              providerPaymentId: remote.data.transactions?.payments?.[0]?.id ?? null,
              source: "webhook",
            });
          }
          await prisma.webhookEvent.update({
            where: { id: event.id },
            data: { status: "PROCESSED", processedAt: new Date() },
          });
        }
      }
    }

    await writeAuditLog({
      action: "SYNC",
      module: "platform.webhooks",
      resource: "WebhookEvent",
      resourceId: webhookEventId || job.id,
      observation: "Webhook de pagamento processado",
    });
  },
  PROCESS_MP_WEBHOOK_RETRY: async (job) => {
    const id = String((job.payload as { mpWebhookEventId?: string }).mpWebhookEventId ?? "");
    if (!id) return;
    const { reprocessMpWebhookEvent } = await import("@/lib/mercado-pago/webhooks/pipeline");
    await reprocessMpWebhookEvent(id);
    await writeAuditLog({
      action: "SYNC",
      module: "payments.mercado_pago",
      resource: "MpWebhookEvent",
      resourceId: id,
      observation: "Retry webhook Mercado Pago",
    });
  },
  MP_RECONCILE: async (job) => {
    const { runMercadoPagoReconciliation } = await import(
      "@/lib/mercado-pago/reconciliation"
    );
    const report = await runMercadoPagoReconciliation({
      limit: Number((job.payload as { limit?: number }).limit ?? 50),
    });
    await writeAuditLog({
      action: "SYNC",
      module: "payments.mercado_pago",
      resource: "MpReconciliationIssue",
      resourceId: job.id,
      observation: `Conciliação: ${report.issuesCreated} issues`,
      metadata: report as unknown as Record<string, unknown>,
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
