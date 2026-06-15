import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleSocialRouteError } from "@/lib/social/api-handler";
import { listProfilePosts } from "@/lib/social/profiles";

type Params = { params: Promise<{ userId: string }> };

export async function GET(req: Request, { params }: Params) {
  try {
    const { user } = await requireAuth();
    const { userId } = await params;
    const url = new URL(req.url);
    const data = await listProfilePosts({
      userId,
      viewerId: user?.id,
      cursor: url.searchParams.get("cursor") ?? undefined,
      limit: Number(url.searchParams.get("limit") ?? "20"),
    });
    return apiSuccess(data);
  } catch (e) {
    return handleSocialRouteError(e);
  }
}
