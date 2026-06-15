import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleSocialRouteError } from "@/lib/social/api-handler";
import { updateComment, deleteComment } from "@/lib/social/comments";

type Params = { params: Promise<{ commentId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { commentId } = await params;
    const body = await req.json();
    const comment = await updateComment({ commentId, authorId: user!.id, content: body.content });
    return apiSuccess({ comment });
  } catch (e) {
    return handleSocialRouteError(e);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { commentId } = await params;
    const comment = await deleteComment({ commentId, userId: user!.id });
    return apiSuccess({ comment });
  } catch (e) {
    return handleSocialRouteError(e);
  }
}
