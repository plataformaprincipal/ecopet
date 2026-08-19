import { AccountStatus, VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { queryPublicPartners, queryPublicProducts, queryPublicServices } from "@/lib/marketplace/public-query";
import { formatTrendCount, rankHashtagTrends, type HashtagTrendInput } from "@/lib/social/trends";

const VISIBLE = ["PUBLISHED", "REPORTED"] as const;

async function scoreHashtags(since: Date, hours: number) {
  const links = await prisma.socialPostHashtag.findMany({
    where: {
      post: {
        deletedAt: null,
        archivedAt: null,
        visibility: "PUBLIC",
        status: { in: [...VISIBLE] },
        createdAt: { gte: since },
      },
    },
    select: {
      hashtag: { select: { id: true, name: true, slug: true } },
      post: {
        select: {
          id: true,
          authorId: true,
          _count: { select: { likes: true, comments: true } },
        },
      },
    },
    take: 4000,
  });

  const map = new Map<
    string,
    {
      id: string;
      name: string;
      slug: string;
      posts: Set<string>;
      authors: Set<string>;
      comments: number;
      likes: number;
    }
  >();

  for (const row of links) {
    const h = row.hashtag;
    const cur = map.get(h.id) ?? {
      id: h.id,
      name: h.name,
      slug: h.slug,
      posts: new Set<string>(),
      authors: new Set<string>(),
      comments: 0,
      likes: 0,
    };
    cur.posts.add(row.post.id);
    cur.authors.add(row.post.authorId);
    cur.comments += row.post._count.comments;
    cur.likes += row.post._count.likes;
    map.set(h.id, cur);
  }

  const inputs: HashtagTrendInput[] = [...map.values()].map((h) => ({
    id: h.id,
    name: h.name,
    slug: h.slug,
    posts: h.posts.size,
    uniqueAuthors: h.authors.size,
    comments: h.comments,
    likes: h.likes,
    hours,
  }));

  return rankHashtagTrends(inputs);
}

/**
 * Tendências a partir de dados reais (janela 24h, fallback 7d).
 * Exclui privado, arquivado, removido e penaliza spam de um único autor.
 */
export async function GET() {
  const now = new Date();
  const window24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const window7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let ranked = await scoreHashtags(window24h, 24);
  let windowUsed: "24h" | "7d" = "24h";

  if (ranked.length < 5) {
    ranked = await scoreHashtags(window7d, 24 * 7);
    windowUsed = "7d";
  }

  const trends = ranked.slice(0, 12).map((t, i) => ({
    position: i + 1,
    topic: t.name.startsWith("#") ? t.name : `#${t.name}`,
    slug: t.slug,
    publications: t.posts,
    uniqueAuthors: t.uniqueAuthors,
    publicationsLabel: formatTrendCount(t.posts),
    category: "hashtag" as const,
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
