import { apiSuccess } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth/require-auth";
import { handleSocialRouteError } from "@/lib/social/api-handler";
import { listFeed } from "@/lib/social/posts";

export async function GET(req: Request) {
  try {
    const { user } = await requireAuth();
    const url = new URL(req.url);
    const data = await listFeed({
      viewerId: user?.id,
      cursor: url.searchParams.get("cursor") ?? undefined,
      limit: Number(url.searchParams.get("limit") ?? "20"),
      hashtag: url.searchParams.get("hashtag") ?? undefined,
      authorId: url.searchParams.get("authorId") ?? undefined,
      petId: url.searchParams.get("petId") ?? undefined,
      mediaType: url.searchParams.get("mediaType") ?? undefined,
      type: (url.searchParams.get("type") as import("@prisma/client").SocialPostType | null) ?? undefined,
    });
    return apiSuccess(data);
  } catch (e) {
    return handleSocialRouteError(e);
  }
}
