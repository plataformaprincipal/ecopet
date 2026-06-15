import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleSocialRouteError } from "@/lib/social/api-handler";
import { listComments, createComment } from "@/lib/social/comments";

type Params = { params: Promise<{ postId: string }> };

export async function GET(req: Request, { params }: Params) {
  try {
    const { user } = await requireAuth();
    const { postId } = await params;
    const url = new URL(req.url);
    const data = await listComments({
      postId,
      viewerId: user?.id,
      cursor: url.searchParams.get("cursor") ?? undefined,
      limit: Number(url.searchParams.get("limit") ?? "30"),
    });
    return apiSuccess(data);
  } catch (e) {
    return handleSocialRouteError(e);
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { postId } = await params;
    const body = await req.json();
    const comment = await createComment({
      postId,
      authorId: user!.id,
      content: body.content,
      parentCommentId: body.parentCommentId,
    });
    return apiSuccess({ comment }, 201);
  } catch (e) {
    return handleSocialRouteError(e);
  }
}
