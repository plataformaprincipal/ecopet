import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleChatRouteError } from "@/lib/messages/api-handler";
import { markConversationRead } from "@/lib/messages/conversations";

type Params = { params: Promise<{ conversationId: string }> };

export async function PATCH(_req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { conversationId } = await params;
    const data = await markConversationRead(conversationId, user!.id);
    return apiSuccess(data);
  } catch (e) {
    return handleChatRouteError(e);
  }
}
