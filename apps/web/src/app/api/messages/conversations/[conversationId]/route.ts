import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleChatRouteError } from "@/lib/messages/api-handler";
import { getConversationDetail } from "@/lib/messages/conversations";

type Params = { params: Promise<{ conversationId: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { conversationId } = await params;
    const conversation = await getConversationDetail(conversationId, user!.id);
    return apiSuccess({ conversation });
  } catch (e) {
    return handleChatRouteError(e);
  }
}
