import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleSocialRouteError } from "@/lib/social/api-handler";
import { getPost, updatePost, deletePost } from "@/lib/social/posts";

type Params = { params: Promise<{ postId: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { user } = await requireAuth();
    const { postId } = await params;
    const post = await getPost(postId, user?.id);
    return apiSuccess({ post });
  } catch (e) {
    return handleSocialRouteError(e);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { postId } = await params;
    const body = await req.json();
    const post = await updatePost({ postId, authorId: user!.id, content: body.content });
    return apiSuccess({ post });
  } catch (e) {
    return handleSocialRouteError(e);
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { postId } = await params;
    const url = new URL(req.url);
    const isAdmin = user!.role === "ADMIN";
    const post = await deletePost({
      postId,
      userId: user!.id,
      isAdmin,
      reason: url.searchParams.get("reason") ?? undefined,
    });
    return apiSuccess({ post });
  } catch (e) {
    return handleSocialRouteError(e);
  }
}
