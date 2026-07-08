import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { emitPlatformEvent, PLATFORM_EVENTS } from "@/lib/events/event-bus";
import { enqueueJob } from "@/lib/jobs/job-queue";
import { writeIntegrationLog } from "@/lib/integrations/log";

export async function receiveWebhook(params: {
  provider: string;
  eventType: string;
  payload: Record<string, unknown>;
  externalId?: string;
  idempotencyKey?: string;
}) {
  if (params.idempotencyKey) {
    const dup = await prisma.webhookEvent.findUnique({ where: { idempotencyKey: params.idempotencyKey } });
    if (dup) {
      return { event: dup, duplicate: true };
    }
  }

  const event = await prisma.webhookEvent.create({
    data: {
      provider: params.provider,
      eventType: params.eventType,
      externalId: params.externalId,
      payload: JSON.parse(JSON.stringify(params.payload)) as Prisma.InputJsonValue,
      idempotencyKey: params.idempotencyKey,
      status: "PENDING",
    },
  });

  await emitPlatformEvent({
    type: PLATFORM_EVENTS.WEBHOOK_RECEIVED,
    entityType: "WebhookEvent",
    entityId: event.id,
    payload: { provider: params.provider, eventType: params.eventType },
    severity: "info",
  });

  try {
    await enqueueJob({
      type: "PROCESS_PAYMENT_WEBHOOK",
      payload: { webhookEventId: event.id, provider: params.provider },
    });
    const processed = await prisma.webhookEvent.update({
      where: { id: event.id },
      data: { status: "PROCESSED", processedAt: new Date() },
    });
    await writeIntegrationLog({
      integrationName: params.provider,
      provider: params.provider,
      action: `webhook:${params.eventType}`,
      status: "success",
      message: "Webhook recebido e enfileirado",
      metadata: { webhookEventId: event.id },
    });
    return { event: processed, duplicate: false };
  } catch (e) {
    const msg = (e as Error).message;
    await prisma.webhookEvent.update({
      where: { id: event.id },
      data: { status: "FAILED", errorMessage: msg },
    });
    await writeIntegrationLog({
      integrationName: params.provider,
      provider: params.provider,
      action: `webhook:${params.eventType}`,
      status: "error",
      message: msg,
    });
    throw e;
  }
}

export async function reprocessWebhook(webhookId: string) {
  const event = await prisma.webhookEvent.findUnique({ where: { id: webhookId } });
  if (!event) throw new Error("NOT_FOUND");
  await enqueueJob({
    type: "PROCESS_PAYMENT_WEBHOOK",
    payload: { webhookEventId: event.id, provider: event.provider, reprocess: true },
  });
  return prisma.webhookEvent.update({
    where: { id: webhookId },
    data: { status: "PENDING", errorMessage: null },
  });
}
