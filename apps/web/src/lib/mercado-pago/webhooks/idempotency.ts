import { prisma } from "@/lib/prisma";
import { hashPayload } from "@/lib/mercado-pago/crypto-utils";

export function buildWebhookIdempotencyKey(params: {
  requestId: string | null;
  eventType: string;
  providerEventId: string | null;
  resourceId: string | null;
  rawBody: string;
}): string {
  if (params.requestId?.trim()) {
    return `mp:req:${params.requestId.trim()}`;
  }
  const hash = hashPayload(params.rawBody).slice(0, 24);
  return `mp:${params.eventType}:${params.providerEventId ?? "x"}:${params.resourceId ?? "x"}:${hash}`;
}

export async function findDuplicateMpWebhook(params: {
  providerEventId: string | null;
  eventType: string;
  resourceId: string | null;
  payloadHash: string;
}) {
  if (params.providerEventId && params.resourceId) {
    const byUnique = await prisma.mpWebhookEvent.findFirst({
      where: {
        providerEventId: params.providerEventId,
        eventType: params.eventType,
        resourceId: params.resourceId,
      },
    });
    if (byUnique) return byUnique;
  }
  return prisma.mpWebhookEvent.findFirst({
    where: { payloadHash: params.payloadHash },
    orderBy: { createdAt: "desc" },
  });
}
