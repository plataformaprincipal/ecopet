import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleChatRouteError } from "@/lib/messages/api-handler";
import { addReaction, removeReaction } from "@/lib/messages/messages";

type Params = { params: Promise<{ messageId: string }> };

export async function POST(req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { messageId } = await params;
    const body = await req.json();
    const reaction = await addReaction(messageId, user!.id, body.emoji);
    return apiSuccess({ reaction }, 201);
  } catch (e) {
    return handleChatRouteError(e);
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { messageId } = await params;
    const url = new URL(req.url);
    const emoji = url.searchParams.get("emoji") ?? "";
    const data = await removeReaction(messageId, user!.id, emoji);
    return apiSuccess(data);
  } catch (e) {
    return handleChatRouteError(e);
  }
}
