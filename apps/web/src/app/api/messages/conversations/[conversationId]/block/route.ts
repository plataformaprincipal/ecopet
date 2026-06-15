import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleChatRouteError } from "@/lib/messages/api-handler";
import { setParticipantFlag } from "@/lib/messages/conversations";
import { prisma } from "@/lib/prisma";
import { auditChatAction } from "@/lib/messages/notifications";

type Params = { params: Promise<{ conversationId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { conversationId } = await params;
    await setParticipantFlag(conversationId, user!.id, "isBlocked", true);
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { status: "BLOCKED", blockedAt: new Date() },
    });
    await auditChatAction({
      actorId: user!.id,
      action: "UPDATE",
      resource: "conversation",
      resourceId: conversationId,
      observation: "blocked_by_participant",
    });
    return apiSuccess({ ok: true });
  } catch (e) {
    return handleChatRouteError(e);
  }
}
