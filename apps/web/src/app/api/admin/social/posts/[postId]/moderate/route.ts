import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { handleSocialRouteError } from "@/lib/social/api-handler";
import { moderatePost } from "@/lib/social/reports";

type Params = { params: Promise<{ postId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAdmin({ path: new URL(req.url).pathname });
    if (error) return error;
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
