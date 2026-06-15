import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleChatRouteError } from "@/lib/messages/api-handler";
import { blockUser, unblockUser } from "@/lib/messages/blocks";

type Params = { params: Promise<{ userId: string }> };

export async function POST(req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { userId } = await params;
    const body = await req.json().catch(() => ({}));
    const block = await blockUser(user!.id, userId, body.reason);
    return apiSuccess({ block }, 201);
  } catch (e) {
    return handleChatRouteError(e);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { userId } = await params;
    const data = await unblockUser(user!.id, userId);
    return apiSuccess(data);
  } catch (e) {
    return handleChatRouteError(e);
  }
}
