import "server-only";
import { prisma } from "@/lib/prisma";

export type MarketplaceProductHit = {
  id: string;
  sku: string | null;
  name: string;
  priceInCents: number;
  stock: number;
  available: boolean;
  sellerName: string;
  href: string;
};

export async function searchMarketplaceProducts(params: {
  query: string;
  species?: string | null;
  take?: number;
}): Promise<MarketplaceProductHit[]> {
  const query = params.query.trim().slice(0, 80);
  if (query.length < 2) return [];
  const products = await prisma.product.findMany({
    where: {
      deletedAt: null,
      approvalStatus: "APPROVED",
      status: "ACTIVE",
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { brand: { contains: query, mode: "insensitive" } },
        { shortDescription: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      sku: true,
      slug: true,
      name: true,
      price: true,
      stock: true,
      seller: { select: { name: true, partnerProfile: { select: { businessName: true } } } },
    },
    take: Math.min(params.take ?? 4, 8),
    orderBy: { stock: "desc" },
  });
  return products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    priceInCents: Math.round(p.price * 100),
    stock: p.stock,
    available: p.stock > 0,
    sellerName: p.seller.partnerProfile?.businessName || p.seller.name,
    href: `/marketplace/produto/${p.slug || p.id}`,
  }));
}

export async function searchMarketplaceProductsFromQueries(queries: string[]): Promise<MarketplaceProductHit[]> {
  const seen = new Set<string>();
  const hits: MarketplaceProductHit[] = [];
  for (const q of queries.slice(0, 3)) {
    const found = await searchMarketplaceProducts({ query: q, take: 3 });
    for (const item of found) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      hits.push(item);
    }
    if (hits.length >= 6) break;
  }
  return hits;
}
