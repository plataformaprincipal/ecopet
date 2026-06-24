import { AccountStatus, VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { listFeed } from "@/lib/social/posts";
import { queryPublicPartners, queryPublicProducts, queryPublicServices } from "@/lib/marketplace/public-query";

export async function GET() {
  const [hashtags, feedPopular, partners, products, services, ngos] = await Promise.all([
    prisma.hashtag.findMany({
      orderBy: { usageCount: "desc" },
      take: 12,
      select: { id: true, name: true, slug: true, usageCount: true },
    }),
    listFeed({ limit: 6 }),
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

  const popularPosts = [...feedPopular.posts].sort(
    (a, b) =>
      b.counts.likes + b.counts.comments + b.counts.shares - (a.counts.likes + a.counts.comments + a.counts.shares)
  );

  return apiSuccess({
    hashtags,
    popularPosts: popularPosts.slice(0, 6),
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
