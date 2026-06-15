import { apiSuccess } from "@/lib/api-response";
import { handleSocialRouteError } from "@/lib/social/api-handler";
import { listHashtags } from "@/lib/social/search";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const hashtags = await listHashtags({
      q: url.searchParams.get("q") ?? undefined,
      limit: Number(url.searchParams.get("limit") ?? "20"),
    });
    return apiSuccess({ hashtags });
  } catch (e) {
    return handleSocialRouteError(e);
  }
}
