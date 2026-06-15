import { apiSuccess, apiFailure } from "@/lib/api-response";
import { handleSocialRouteError } from "@/lib/social/api-handler";
import { getHashtagBySlug } from "@/lib/social/search";
import { listFeed } from "@/lib/social/posts";
import { requireAuth } from "@/lib/auth/require-auth";

type Params = { params: Promise<{ slug: string }> };

export async function GET(req: Request, { params }: Params) {
  try {
    const { user } = await requireAuth();
    const { slug } = await params;
    const hashtag = await getHashtagBySlug(slug);
    if (!hashtag) return apiFailure("NOT_FOUND", "Hashtag não encontrada.", 404);

    const url = new URL(req.url);
    const feed = await listFeed({
      viewerId: user?.id,
      hashtag: slug,
      cursor: url.searchParams.get("cursor") ?? undefined,
      limit: Number(url.searchParams.get("limit") ?? "20"),
    });

    return apiSuccess({ hashtag, ...feed });
  } catch (e) {
    return handleSocialRouteError(e);
  }
}
