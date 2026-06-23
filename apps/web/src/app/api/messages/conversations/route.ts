import { ConversationContextType, ConversationType } from "@prisma/client";
import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleChatRouteError } from "@/lib/messages/api-handler";
import { listUserConversations, createConversation } from "@/lib/messages/conversations";
import { createOrGetTalkJsConversation } from "@/lib/messages/talkjs-conversations";
import { requireActiveChatUser } from "@/lib/messages/permissions";
import { isTalkJsConfigured } from "@/lib/talkjs/client";

export async function GET(req: Request) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    await requireActiveChatUser(user!.id);

    const url = new URL(req.url);
    const type = url.searchParams.get("type") as ConversationType | null;
    const q = url.searchParams.get("q") ?? undefined;
    const page = Number(url.searchParams.get("page") ?? "1");

    const data = await listUserConversations({
      userId: user!.id,
      type: type ?? undefined,
      q,
      page,
    });
    return apiSuccess(data);
  } catch (e) {
    return handleChatRouteError(e);
  }
}

export async function POST(req: Request) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    await requireActiveChatUser(user!.id);

    const body = await req.json();
    const type = body.type as ConversationType | undefined;
    const participantUserIds = (body.participantUserIds ?? body.participantIds ?? []) as string[];
    const participantUserId = (body.participantUserId ?? participantUserIds[0]) as string | undefined;
    const contextType = body.contextType as ConversationContextType | undefined;
    const contextId = body.contextId as string | null | undefined;

    if (isTalkJsConfigured() && participantUserId) {
      const result = await createOrGetTalkJsConversation({
        creatorId: user!.id,
        participantUserId,
        contextType,
        contextId,
        title: body.title,
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
    }

    const conversation = await createConversation({
      creatorId: user!.id,
      type,
      title: body.title,
      participantUserIds,
    });

    return apiSuccess({ conversation, conversationId: conversation.id }, 201);
  } catch (e) {
    return handleChatRouteError(e);
  }
}
