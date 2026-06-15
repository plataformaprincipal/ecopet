import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleSocialRouteError } from "@/lib/social/api-handler";
import { moderateComment } from "@/lib/social/reports";
import { requireAdmin } from "@/lib/social/permissions";

type Params = { params: Promise<{ commentId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth(["ADMIN"]);
    if (error) return error;
    await requireAdmin(user!.id);
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
