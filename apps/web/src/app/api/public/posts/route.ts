import { apiSuccess } from "@/lib/api-response";
import { listFeed } from "@/lib/social/posts";
import { getCurrentUser } from "@/lib/auth";
import type { SocialPostType } from "@prisma/client";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const user = await getCurrentUser();
  const typeParam = url.searchParams.get("type");
  const sort = url.searchParams.get("sort") ?? "recent";

  const data = await listFeed({
    viewerId: user?.id,
    cursor: url.searchParams.get("cursor") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? "20"),
    hashtag: url.searchParams.get("hashtag") ?? undefined,
    type: (typeParam as SocialPostType | null) ?? undefined,
  });

  if (sort === "popular") {
    data.posts.sort(
      (a, b) =>
        b.counts.likes + b.counts.comments + b.counts.shares - (a.counts.likes + a.counts.comments + a.counts.shares)
    );
  }

  return apiSuccess(data);
}
