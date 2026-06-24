import type { ApiSocialPost } from "@/lib/social/client-api";

type ApiBody<T> = { success: boolean; data?: T; error?: { message: string } };

async function publicFetch<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: "include" });
  const body = (await res.json().catch(() => ({}))) as ApiBody<T>;
  if (!res.ok || body.success === false) {
    throw new Error(body.error?.message ?? `Erro ${res.status}`);
  }
  return body.data as T;
}

export async function fetchPublicPosts(params?: {
  cursor?: string;
  limit?: number;
  type?: string;
  hashtag?: string;
  sort?: "recent" | "popular";
}) {
  const q = new URLSearchParams();
  if (params?.cursor) q.set("cursor", params.cursor);
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.type) q.set("type", params.type);
  if (params?.hashtag) q.set("hashtag", params.hashtag);
  if (params?.sort) q.set("sort", params.sort);
  return publicFetch<{ posts: ApiSocialPost[]; nextCursor: string | null }>(`/api/public/posts?${q}`);
}

export type PublicTrendingData = {
  hashtags: Array<{ id: string; name: string; slug: string; usageCount: number }>;
  popularPosts: ApiSocialPost[];
  featuredPartners: Array<{ id: string; name: string; category?: string | null; city?: string | null }>;
  featuredProducts: Array<{ id: string; name: string; price: number }>;
  featuredServices: Array<{ id: string; name: string; price: number; category: string }>;
  ngos: Array<{ id: string; name: string; city?: string | null }>;
};

export async function fetchPublicTrending() {
  return publicFetch<PublicTrendingData>("/api/public/trending");
}

export type PublicMarketplaceData = {
  products: Array<{
    id: string;
    name: string;
    price: number;
    stock?: number;
    catalogCategory?: string | null;
    images?: unknown;
    shortDescription?: string | null;
    seller?: { id?: string; partnerProfile?: { businessName?: string; city?: string } | null } | null;
    rating?: number;
    reviewCount?: number;
  }>;
  services: Array<{
    id: string;
    name: string;
    price: number;
    category: string;
    rating?: number;
    reviewCount?: number;
    provider?: { partnerProfile?: { businessName?: string; city?: string } };
  }>;
  totalProducts: number;
  totalServices: number;
};

export async function fetchPublicMarketplace(params?: Record<string, string>) {
  const q = new URLSearchParams(params);
  return publicFetch<PublicMarketplaceData>(`/api/public/marketplace?${q}`);
}

export type PublicExploreExtended = {
  counts: { products: number; services: number; partners: number; adoptions: number };
  products: Array<{ id: string; name: string; price: number; catalogCategory?: string | null }>;
  services: Array<{ id: string; name: string; price: number; category: string }>;
  partners: Array<{ id: string; name: string; category?: string | null; city?: string | null }>;
  trending?: PublicTrendingData;
};

export async function fetchPublicExplore(params?: { q?: string; category?: string }) {
  const q = new URLSearchParams();
  if (params?.q) q.set("q", params.q);
  if (params?.category) q.set("category", params.category);
  q.set("extended", "true");
  return publicFetch<PublicExploreExtended>(`/api/public/explore?${q}`);
}
