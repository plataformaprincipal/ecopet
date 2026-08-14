import { AccountStatus, VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { queryPublicPartners, queryPublicProducts, queryPublicServices } from "@/lib/marketplace/public-query";

const POST_W = 3;
const COMMENT_W = 2;
const LIKE_W = 1;

function formatCount(n: number): string {
  if (n >= 1000) {
    const v = n / 1000;
    return `${v.toFixed(v >= 10 ? 0 : 1).replace(".", ",")} mil`;
  }
  return String(n);
}

/**
 * Tendências a partir de dados reais (janela 7d, fallback 30d / lifetime usageCount).
 * score = posts*3 + comments*2 + likes*1
 */
export async function GET() {
  const now = new Date();
  const window7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const window30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  async function scoreHashtags(since: Date) {
    const links = await prisma.socialPostHashtag.findMany({
      where: {
        post: {
          deletedAt: null,
          archivedAt: null,
          status: { in: ["PUBLISHED", "REPORTED"] },
          createdAt: { gte: since },
        },
      },
      select: {
        hashtag: { select: { id: true, name: true, slug: true, usageCount: true } },
        post: {
          select: {
            _count: { select: { likes: true, comments: true } },
          },
        },
      },
      take: 2000,
    });

    const map = new Map<
      string,
      { id: string; name: string; slug: string; usageCount: number; posts: number; comments: number; likes: number }
    >();

    for (const row of links) {
      const h = row.hashtag;
      const cur = map.get(h.id) ?? {
        id: h.id,
        name: h.name,
        slug: h.slug,
        usageCount: h.usageCount,
        posts: 0,
        comments: 0,
        likes: 0,
      };
      cur.posts += 1;
      cur.comments += row.post._count.comments;
      cur.likes += row.post._count.likes;
      map.set(h.id, cur);
    }

    return [...map.values()]
      .map((h) => ({
        ...h,
        trendScore: h.posts * POST_W + h.comments * COMMENT_W + h.likes * LIKE_W,
        publicationsLabel: formatCount(h.posts),
        category: "hashtag" as const,
      }))
      .sort((a, b) => b.trendScore - a.trendScore || b.posts - a.posts);
  }

  let ranked = await scoreHashtags(window7d);
  let windowUsed: "7d" | "30d" | "all" = "7d";

  if (ranked.length < 5) {
    ranked = await scoreHashtags(window30d);
    windowUsed = "30d";
  }

  if (ranked.length < 3) {
    const fallback = await prisma.hashtag.findMany({
      orderBy: { usageCount: "desc" },
      take: 12,
      select: { id: true, name: true, slug: true, usageCount: true },
    });
    ranked = fallback.map((h) => ({
      id: h.id,
      name: h.name,
      slug: h.slug,
      usageCount: h.usageCount,
      posts: h.usageCount,
      comments: 0,
      likes: 0,
      trendScore: h.usageCount,
      publicationsLabel: formatCount(h.usageCount),
      category: "hashtag" as const,
    }));
    windowUsed = "all";
  }

  const trends = ranked.slice(0, 12).map((t, i) => ({
    position: i + 1,
    topic: t.name.startsWith("#") ? t.name : `#${t.name}`,
    slug: t.slug,
    publications: t.posts,
    publicationsLabel: t.publicationsLabel,
    category: t.category,
    score: t.trendScore,
  }));

  const [partners, products, services, ngos] = await Promise.all([
    queryPublicPartners({ pageSize: 6 }),
    queryPublicProducts({ pageSize: 6 }),
    queryPublicServices({ pageSize: 6 }),
    prisma.user.findMany({
      where: {
        role: "ONG",
        accountStatus: AccountStatus.ACTIVE,
        ongProfile: { is: { verificationStatus: VerificationStatus.APPROVED } },
      },
      select: {
        id: true,
        name: true,
        ongProfile: { select: { city: true, ongName: true, name: true } },
      },
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return apiSuccess({
    window: windowUsed,
    trends,
    hashtags: trends.map((t) => ({
      id: t.slug,
      name: t.topic.replace(/^#/, ""),
      slug: t.slug,
      usageCount: t.publications,
    })),
    popularPosts: [],
    featuredPartners: partners.partners.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      city: p.city,
    })),
    featuredProducts: products.products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
    })),
    featuredServices: services.services.map((s) => ({
      id: s.id,
      name: s.name,
      price: s.price,
      category: s.category,
    })),
    ngos: ngos.map((n) => ({
      id: n.id,
      name: n.ongProfile?.ongName ?? n.ongProfile?.name ?? n.name,
      city: n.ongProfile?.city ?? null,
    })),
  });
}
