import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleSocialRouteError } from "@/lib/social/api-handler";
import { sharePost } from "@/lib/social/interactions";

type Params = { params: Promise<{ postId: string }> };

export async function POST(req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { postId } = await params;
    const body = await req.json().catch(() => ({}));
    const data = await sharePost({
      postId,
      userId: user!.id,
      targetConversationId: body.targetConversationId,
      message: body.message,
    });
    return apiSuccess(data, 201);
  } catch (e) {
    return handleSocialRouteError(e);
  }
}
