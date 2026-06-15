import { UserRole } from "@prisma/client";
import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleChatRouteError } from "@/lib/messages/api-handler";
import { editMessage, deleteMessage } from "@/lib/messages/messages";

type Params = { params: Promise<{ messageId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { messageId } = await params;
    const body = await req.json();
    const message = await editMessage(messageId, user!.id, body.content);
    return apiSuccess({ message });
  } catch (e) {
    return handleChatRouteError(e);
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { messageId } = await params;
    const body = await req.json().catch(() => ({}));
    const isAdmin = user!.role === UserRole.ADMIN;
    const message = await deleteMessage(messageId, user!.id, isAdmin, body.reason);
    return apiSuccess({ message });
  } catch (e) {
    return handleChatRouteError(e);
  }
}
