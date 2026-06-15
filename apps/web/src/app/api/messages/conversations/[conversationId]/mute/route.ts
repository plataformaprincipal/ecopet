import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleChatRouteError } from "@/lib/messages/api-handler";
import { setParticipantFlag } from "@/lib/messages/conversations";

type Params = { params: Promise<{ conversationId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { conversationId } = await params;
    const body = await req.json().catch(() => ({}));
    await setParticipantFlag(conversationId, user!.id, "isMuted", body.value !== false);
    return apiSuccess({ ok: true });
  } catch (e) {
    return handleChatRouteError(e);
  }
}
