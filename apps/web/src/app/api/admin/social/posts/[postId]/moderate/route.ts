import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleSocialRouteError } from "@/lib/social/api-handler";
import { moderatePost } from "@/lib/social/reports";
import { requireAdmin } from "@/lib/social/permissions";

type Params = { params: Promise<{ postId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth(["ADMIN"]);
    if (error) return error;
    await requireAdmin(user!.id);
    const { postId } = await params;
    const body = await req.json();
    const post = await moderatePost({
      postId,
      adminId: user!.id,
      action: body.action,
      reason: body.reason,
    });
    return apiSuccess({ post });
  } catch (e) {
    return handleSocialRouteError(e);
  }
}
