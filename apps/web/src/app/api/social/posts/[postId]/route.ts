import type { SocialPostVisibility } from "@prisma/client";
import { apiSuccess, apiFailure } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleSocialRouteError } from "@/lib/social/api-handler";
import { getPost, updatePost, deletePost, hardDeletePost } from "@/lib/social/posts";

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
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") {
      return apiFailure("VALIDATION", "Payload inválido.", 400);
    }

    const content = typeof body.content === "string" ? body.content : undefined;
    const visibility =
      typeof body.visibility === "string" ? (body.visibility as SocialPostVisibility) : undefined;
    const commentsEnabled =
      typeof body.commentsEnabled === "boolean" ? body.commentsEnabled : undefined;
    const hideLikeCount = typeof body.hideLikeCount === "boolean" ? body.hideLikeCount : undefined;
    const isPinned = typeof body.isPinned === "boolean" ? body.isPinned : undefined;
    const archive = body.archive === true;
    const unarchive = body.unarchive === true;
    const restore = body.restore === true;

    if (
      content === undefined &&
      visibility === undefined &&
      commentsEnabled === undefined &&
      hideLikeCount === undefined &&
      isPinned === undefined &&
      !archive &&
      !unarchive &&
      !restore
    ) {
      return apiFailure("VALIDATION", "Nenhuma alteração informada.", 400);
    }

    const post = await updatePost({
      postId,
      authorId: user!.id,
      content,
      visibility,
      commentsEnabled,
      hideLikeCount,
      isPinned,
      archive: archive || undefined,
      unarchive: unarchive || undefined,
      restore: restore || undefined,
    });
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
    if (url.searchParams.get("hard") === "true") {
      const result = await hardDeletePost({ postId, userId: user!.id });
      return apiSuccess(result);
    }
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
