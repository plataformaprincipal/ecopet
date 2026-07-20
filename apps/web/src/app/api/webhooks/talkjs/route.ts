import type { Prisma } from "@prisma/client";
import { apiFailure, apiSuccess } from "@/lib/api-response";
import { createNotification } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";
import { isMessagingFlagEnabled, getTalkJsPrivateConfig } from "@/lib/talkjs/config";
import {
  verifyTalkJsWebhookSignature,
  hashWebhookPayload,
  buildWebhookIdempotencyKey,
} from "@/lib/talkjs/webhook-security";

/**
 * Webhook TalkJS — /api/webhooks/talkjs
 * Produção: exige TALKJS_WEBHOOK_SECRET + assinatura HMAC.
 * Test Mode: pode usar TALKJS_SECRET_KEY; configure TALKJS_WEBHOOK_VERIFY=1 após ativar no painel.
 */
export async function POST(req: Request) {
  if (!isMessagingFlagEnabled("webhooks")) {
    return apiFailure("WEBHOOKS_DISABLED", "Webhooks TalkJS desativados.", 503);
  }

  const priv = getTalkJsPrivateConfig();
  if (!priv.secretKey && !priv.webhookSecret) {
    return apiFailure("TALKJS_NOT_CONFIGURED", "TalkJS webhook não configurado.", 503);
  }

  const signature = req.headers.get("x-talkjs-signature") ?? req.headers.get("X-TalkJS-Signature");
  const timestamp = req.headers.get("x-talkjs-timestamp") ?? req.headers.get("X-TalkJS-Timestamp");
  const rawBody = await req.text();

  const verify = verifyTalkJsWebhookSignature({
    rawBody,
    signature,
    timestamp,
  });

  if (!verify.ok) {
    return apiFailure("INVALID_SIGNATURE", "Assinatura do webhook inválida.", 401);
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return apiFailure("VALIDATION", "Payload inválido.", 400);
  }

  const eventType = String(payload.type ?? payload.event ?? "unknown");
  const data = (payload.data ?? payload) as Record<string, unknown>;
  const conversationRaw = data.conversation;
  const conversationObj =
    conversationRaw && typeof conversationRaw === "object"
      ? (conversationRaw as Record<string, unknown>)
      : null;
  const senderRaw = data.sender;
  const senderObj =
    senderRaw && typeof senderRaw === "object" ? (senderRaw as Record<string, unknown>) : null;

  const talkjsConversationId = String(
    data.conversationId ?? conversationObj?.id ?? conversationRaw ?? ""
  );
  const senderId = String(data.senderId ?? senderObj?.id ?? data.userId ?? "");
  const messageId = String(data.id ?? data.messageId ?? "");
  const messageText = String(data.message ?? data.text ?? data.body ?? "Nova mensagem").slice(0, 200);

  const payloadHash = hashWebhookPayload(rawBody);
  const externalId = messageId || `${eventType}:${talkjsConversationId}:${senderId}`;
  const idempotencyKey = buildWebhookIdempotencyKey(externalId, payloadHash);

  const existing = await prisma.webhookEvent.findUnique({
    where: { idempotencyKey },
    select: { id: true, status: true },
  });
  if (existing) {
    return apiSuccess({ received: true, duplicate: true, eventType });
  }

  const sanitized: Prisma.InputJsonValue = {
    type: eventType,
    conversationId: talkjsConversationId || null,
    senderId: senderId || null,
    messageId: messageId || null,
    verifyMode: verify.reason ?? "verified",
  };

  let eventRow: { id: string };
  try {
    eventRow = await prisma.webhookEvent.create({
      data: {
        provider: "talkjs",
        eventType,
        externalId,
        payload: sanitized,
        payloadHash,
        status: "PENDING",
        idempotencyKey,
        attemptCount: 1,
      },
      select: { id: true },
    });
  } catch {
    return apiSuccess({ received: true, duplicate: true, eventType });
  }

  try {
    if (eventType.toLowerCase().includes("message") && talkjsConversationId) {
      if (!isMessagingFlagEnabled("notifications")) {
        await prisma.webhookEvent.update({
          where: { id: eventRow.id },
          data: { status: "PROCESSED", processedAt: new Date() },
        });
        return apiSuccess({ received: true, eventType, notifications: false });
      }

      const conversation = await prisma.conversation.findUnique({
        where: { talkjsConversationId },
        include: {
          participants: { where: { leftAt: null }, select: { userId: true, isMuted: true } },
        },
      });

      if (conversation) {
        const dedupeKey = `talkjs_msg:${messageId || payloadHash}:${conversation.id}`;
        const recent = await prisma.notification.findFirst({
          where: {
            createdAt: { gte: new Date(Date.now() - 2 * 60 * 1000) },
            type: "MESSAGE",
            metadata: { path: ["dedupeKey"], equals: dedupeKey },
          },
          select: { id: true },
        });

        if (!recent) {
          for (const p of conversation.participants) {
            if (p.userId === senderId || p.isMuted) continue;
            await createNotification({
              userId: p.userId,
              type: "MESSAGE",
              title: "Nova mensagem",
              message: messageText,
              actionUrl: `/dashboard/messages/${conversation.id}`,
              metadata: {
                conversationId: conversation.id,
                talkjsConversationId,
                source: "talkjs_webhook",
                dedupeKey,
                eventId: eventRow.id,
              },
            });
          }
        }
      }
    }

    await prisma.webhookEvent.update({
      where: { id: eventRow.id },
      data: { status: "PROCESSED", processedAt: new Date() },
    });

    return apiSuccess({ received: true, eventType });
  } catch (err) {
    const msg = err instanceof Error ? err.message.slice(0, 300) : "webhook_failed";
    await prisma.webhookEvent.update({
      where: { id: eventRow.id },
      data: { status: "FAILED", errorMessage: msg, failureReason: msg },
    });
    return apiFailure("WEBHOOK_PROCESSING_ERROR", "Falha ao processar webhook.", 500);
  }
}
