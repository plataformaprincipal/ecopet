import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth/guards";
import { handleSocialRouteError } from "@/lib/social/api-handler";
import { moderateComment } from "@/lib/social/reports";

type Params = { params: Promise<{ commentId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAdmin({ path: new URL(req.url).pathname });
    if (error) return error;
    const { commentId } = await params;
    const body = await req.json();
    const comment = await moderateComment({
      commentId,
      adminId: user!.id,
      action: body.action,
      reason: body.reason,
    });
    return apiSuccess({ comment });
  } catch (e) {
    return handleSocialRouteError(e);
  }
}
