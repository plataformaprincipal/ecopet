import { ConversationType } from "@prisma/client";
import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleChatRouteError } from "@/lib/messages/api-handler";
import { listUserConversations, createConversation } from "@/lib/messages/conversations";
import { requireActiveChatUser } from "@/lib/messages/permissions";

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

    const conversation = await createConversation({
      creatorId: user!.id,
      type,
      title: body.title,
      participantUserIds,
    });

    return apiSuccess({ conversation }, 201);
  } catch (e) {
    return handleChatRouteError(e);
  }
}
