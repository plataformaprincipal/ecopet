import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleSocialRouteError } from "@/lib/social/api-handler";
import { togglePostLike } from "@/lib/social/interactions";

type Params = { params: Promise<{ postId: string }> };

export async function POST(_req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { postId } = await params;
    const data = await togglePostLike({ postId, userId: user!.id, like: true });
    return apiSuccess(data);
  } catch (e) {
    return handleSocialRouteError(e);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { postId } = await params;
    const data = await togglePostLike({ postId, userId: user!.id, like: false });
    return apiSuccess(data);
  } catch (e) {
    return handleSocialRouteError(e);
  }
}
