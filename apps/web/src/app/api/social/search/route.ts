import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleSocialRouteError } from "@/lib/social/api-handler";
import { searchSocial } from "@/lib/social/search";

export async function GET(req: Request) {
  try {
    const { user } = await requireAuth();
    const url = new URL(req.url);
    const data = await searchSocial({
      q: url.searchParams.get("q") ?? "",
      viewerId: user?.id,
      type: (url.searchParams.get("type") as "all" | "posts" | "hashtags" | "profiles") ?? "all",
      limit: Number(url.searchParams.get("limit") ?? "20"),
    });
    return apiSuccess(data);
  } catch (e) {
    return handleSocialRouteError(e);
  }
}
