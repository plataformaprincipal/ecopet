import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleChatRouteError } from "@/lib/messages/api-handler";
import { setParticipantFlag } from "@/lib/messages/conversations";

type Params = { params: Promise<{ conversationId: string }> };

async function patchFlag(
  req: Request,
  params: Params,
  flag: "isArchived" | "isMuted" | "isBlocked"
) {
  const { user, error } = await requireAuth();
  if (error) return error;
  const { conversationId } = await params.params;
  const body = await req.json().catch(() => ({}));
  const value = body.value !== false;
  await setParticipantFlag(conversationId, user!.id, flag, value);
  return apiSuccess({ ok: true });
}

export async function PATCH(req: Request, ctx: Params) {
  try {
    return patchFlag(req, ctx, "isArchived");
  } catch (e) {
    return handleChatRouteError(e);
  }
}
