import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleSocialRouteError } from "@/lib/social/api-handler";
import { toggleCommentLike } from "@/lib/social/comments";

type Params = { params: Promise<{ commentId: string }> };

export async function POST(_req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { commentId } = await params;
    const data = await toggleCommentLike({ commentId, userId: user!.id, like: true });
    return apiSuccess(data);
  } catch (e) {
    return handleSocialRouteError(e);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { commentId } = await params;
    const data = await toggleCommentLike({ commentId, userId: user!.id, like: false });
    return apiSuccess(data);
  } catch (e) {
    return handleSocialRouteError(e);
  }
}
