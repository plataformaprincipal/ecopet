import { z } from "zod";
import { ConversationContextType } from "@prisma/client";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleChatRouteError } from "@/lib/messages/api-handler";
import { requireActiveChatUser } from "@/lib/messages/permissions";
import { openContextualConversation } from "@/lib/talkjs/contextual-conversations";
import { isTalkJsConfigured } from "@/lib/talkjs/client";

export const dynamic = "force-dynamic";

const schema = z.object({
  contextType: z.nativeEnum(ConversationContextType),
  contextId: z.string().min(1).max(120),
  participantUserId: z.string().optional(),
  title: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  try {
    const { user, error } = await requireAuth();
    if (error || !user) return error!;

    await requireActiveChatUser(user.id);

    if (!isTalkJsConfigured()) {
      return apiFailure("TALKJS_NOT_CONFIGURED", "TalkJS não configurado.", 503);
    }

    const body = await request.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return apiFailure("VALIDATION", parsed.error.errors[0]?.message ?? "Dados inválidos", 400);
    }

    const result = await openContextualConversation({
      creatorId: user.id,
      contextType: parsed.data.contextType,
      contextId: parsed.data.contextId,
      participantUserId: parsed.data.participantUserId,
      title: parsed.data.title,
    });

    return apiSuccess(
      {
        conversation: result.conversation,
        conversationId: result.conversation.id,
        talkjsConversationId: result.conversation.talkjsConversationId,
        created: result.created,
      },
      result.created ? 201 : 200
    );
  } catch (e) {
    return handleChatRouteError(e);
  }
}
