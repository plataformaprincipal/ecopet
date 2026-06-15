import { prisma } from "@/lib/prisma";
import { SOCIAL_ROLE_LABELS } from "@/lib/social/constants";
import { getBlockedUserIds } from "@/lib/social/permissions";

export async function searchSocial(params: {
  q: string;
  viewerId?: string;
  type?: "all" | "posts" | "hashtags" | "profiles";
  limit?: number;
}) {
  const q = params.q.trim();
  const limit = Math.min(params.limit ?? 20, 50);
  if (!q) return { posts: [], hashtags: [], profiles: [] };

  const blockedIds = params.viewerId ? await getBlockedUserIds(params.viewerId) : [];
  const type = params.type ?? "all";

  const results: {
    posts: unknown[];
    hashtags: unknown[];
    profiles: unknown[];
  } = { posts: [], hashtags: [], profiles: [] };

  if (type === "all" || type === "hashtags") {
    results.hashtags = await prisma.hashtag.findMany({
      where: {
        OR: [
          { slug: { contains: q.toLowerCase() } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { usageCount: "desc" },
      take: limit,
      select: { id: true, name: true, slug: true, usageCount: true },
    });
  }

  if (type === "all" || type === "profiles") {
    const profiles = await prisma.publicProfile.findMany({
      where: {
        visibility: "PUBLIC",
        userId: blockedIds.length ? { notIn: blockedIds } : undefined,
        OR: [
          { displayName: { contains: q, mode: "insensitive" } },
          { bio: { contains: q, mode: "insensitive" } },
        ],
      },
      take: limit,
      include: { user: { select: { id: true, role: true, avatar: true, avatarUrl: true } } },
    });
    results.profiles = profiles.map((p) => ({
      userId: p.userId,
      displayName: p.displayName,
      bio: p.bio,
      avatarUrl: p.avatarUrl ?? p.user.avatarUrl ?? p.user.avatar,
      roleLabel: SOCIAL_ROLE_LABELS[p.user.role] ?? p.user.role,
    }));
  }

  if (type === "all" || type === "posts") {
    results.posts = await prisma.socialPost.findMany({
      where: {
        status: "PUBLISHED",
        deletedAt: null,
        visibility: "PUBLIC",
        authorId: blockedIds.length ? { notIn: blockedIds } : undefined,
        OR: [
          { content: { contains: q, mode: "insensitive" } },
          { author: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: { select: { id: true, name: true, avatar: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
  }

  return results;
}

export async function listHashtags(params: { q?: string; limit?: number }) {
  const limit = Math.min(params.limit ?? 20, 50);
  return prisma.hashtag.findMany({
    where: params.q
      ? {
          OR: [
            { slug: { contains: params.q.toLowerCase() } },
            { name: { contains: params.q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { usageCount: "desc" },
    take: limit,
    select: { id: true, name: true, slug: true, usageCount: true },
  });
}

export async function getHashtagBySlug(slug: string) {
  const hashtag = await prisma.hashtag.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, usageCount: true, createdAt: true, updatedAt: true },
  });
  if (!hashtag) return null;
  return hashtag;
}
