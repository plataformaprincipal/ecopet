import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleSocialRouteError } from "@/lib/social/api-handler";
import { followUser, unfollowUser } from "@/lib/social/profiles";

type Params = { params: Promise<{ userId: string }> };

export async function POST(_req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { userId } = await params;
    const data = await followUser({ followerId: user!.id, followingId: userId });
    return apiSuccess(data);
  } catch (e) {
    return handleSocialRouteError(e);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    const { userId } = await params;
    const data = await unfollowUser({ followerId: user!.id, followingId: userId });
    return apiSuccess(data);
  } catch (e) {
    return handleSocialRouteError(e);
  }
}
