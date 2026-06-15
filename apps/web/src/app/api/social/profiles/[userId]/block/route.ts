import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleSocialRouteError } from "@/lib/social/api-handler";
import { blockUser, unblockUser } from "@/lib/social/profiles";

type Params = { params: Promise<{ userId: string }> };

export async function POST(req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { userId } = await params;
    const body = await req.json().catch(() => ({}));
    const data = await blockUser({ blockerId: user!.id, blockedId: userId, reason: body.reason });
    return apiSuccess(data);
  } catch (e) {
    return handleSocialRouteError(e);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { userId } = await params;
    const data = await unblockUser({ blockerId: user!.id, blockedId: userId });
    return apiSuccess(data);
  } catch (e) {
    return handleSocialRouteError(e);
  }
}
