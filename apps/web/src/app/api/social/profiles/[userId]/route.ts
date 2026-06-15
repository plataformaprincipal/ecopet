import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleSocialRouteError } from "@/lib/social/api-handler";
import { getPublicProfile } from "@/lib/social/profiles";

type Params = { params: Promise<{ userId: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { user } = await requireAuth();
    const { userId } = await params;
    const profile = await getPublicProfile(userId, user?.id);
    return apiSuccess({ profile });
  } catch (e) {
    return handleSocialRouteError(e);
  }
}
