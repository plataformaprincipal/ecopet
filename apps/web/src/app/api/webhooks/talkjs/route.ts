import { apiFailure, apiSuccess } from "@/lib/api-response";
import { createNotification } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";

/**
 * Webhook TalkJS — preparado para eventos de novas mensagens.
 * Ative no painel TalkJS e configure a URL: /api/webhooks/talkjs
 *
 * Validação de assinatura: habilite quando o plano TalkJS suportar
 * (header X-TalkJS-Signature ou equivalente documentado).
 */
export async function POST(req: Request) {
  const secret = process.env.TALKJS_SECRET_KEY?.trim();
  if (!secret) {
    return apiFailure("TALKJS_NOT_CONFIGURED", "TalkJS webhook não configurado.", 503);
  }

  const signature = req.headers.get("x-talkjs-signature") ?? req.headers.get("X-TalkJS-Signature");
  const rawBody = await req.text();

  // Placeholder: validar assinatura quando ativado no painel TalkJS
  if (process.env.TALKJS_WEBHOOK_VERIFY === "1" && !signature) {
    return apiFailure("INVALID_SIGNATURE", "Assinatura do webhook ausente.", 401);
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return apiFailure("VALIDATION", "Payload inválido.", 400);
  }

  const eventType = String(payload.type ?? payload.event ?? "");
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
  const messageText = String(data.message ?? data.text ?? data.body ?? "Nova mensagem");

  if (eventType.includes("message") && talkjsConversationId) {
    const conversation = await prisma.conversation.findUnique({
      where: { talkjsConversationId },
      include: { participants: { where: { leftAt: null }, select: { userId: true } } },
    });

    if (conversation) {
      for (const p of conversation.participants) {
        if (p.userId === senderId) continue;
        await createNotification({
          userId: p.userId,
          type: "MESSAGE",
          title: "Nova mensagem",
          message: messageText.slice(0, 200),
          actionUrl: `/dashboard/messages/${conversation.id}`,
          metadata: {
            conversationId: conversation.id,
            talkjsConversationId,
            source: "talkjs_webhook",
          },
        });
      }
    }
  }

  return apiSuccess({ received: true, eventType });
}
