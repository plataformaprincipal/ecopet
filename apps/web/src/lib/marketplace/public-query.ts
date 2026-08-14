import { AccountStatus, PartnerServiceStatus, ProductCatalogStatus, Prisma, VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { haversineDistanceKm } from "@/lib/google-maps/distance";
import { isValidLatLng } from "@/lib/google-maps/validation";

export type PublicSort =
  | "relevance"
  | "newest"
  | "price_asc"
  | "price_desc"
  | "popular"
  | "rating"
  | "near_me";

export type PublicServiceFilters = {
  q?: string;
  category?: string;
  species?: string;
  city?: string;
  state?: string;
  partnerId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  telehealth?: boolean;
  emergency24h?: boolean;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  sort?: PublicSort;
  page?: number;
  pageSize?: number;
};

export async function queryPublicServices(filters: PublicServiceFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 12));
  const skip = (page - 1) * pageSize;

  const origin =
    filters.lat != null && filters.lng != null && isValidLatLng({ lat: filters.lat, lng: filters.lng })
      ? { lat: filters.lat, lng: filters.lng }
      : null;

  const where: Prisma.ServiceWhereInput = {
    deletedAt: null,
    status: PartnerServiceStatus.ACTIVE,
    isActive: true,
    approvalStatus: "APPROVED",
    provider: {
      accountStatus: AccountStatus.ACTIVE,
      role: "PARTNER" as const,
      partnerProfile: {
        is: {
          verificationStatus: VerificationStatus.APPROVED,
          approvedAt: { not: null },
          ...(filters.city ? { city: { contains: filters.city, mode: "insensitive" as const } } : {}),
          ...(filters.state ? { state: { equals: filters.state, mode: "insensitive" as const } } : {}),
        },
      },
    },
    ...(filters.category ? { category: filters.category as never } : {}),
    ...(filters.species ? { speciesTarget: filters.species as never } : {}),
    ...(filters.partnerId ? { providerId: filters.partnerId } : {}),
    ...(filters.minPrice || filters.maxPrice
      ? {
          price: {
            ...(filters.minPrice ? { gte: filters.minPrice } : {}),
            ...(filters.maxPrice ? { lte: filters.maxPrice } : {}),
          },
        }
      : {}),
    ...(filters.minRating ? { rating: { gte: filters.minRating } } : {}),
    ...(filters.telehealth ? { modality: "ONLINE" as const } : {}),
    ...(filters.emergency24h ? { category: "EMERGENCY_24H" as never } : {}),
    ...(filters.q
      ? {
          OR: [
            { name: { contains: filters.q, mode: "insensitive" } },
            { description: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            partnerProfile: {
              select: {
                businessName: true,
                city: true,
                state: true,
                description: true,
                latitude: true,
                longitude: true,
              },
            },
          },
        },
        serviceReviews: {
          where: { moderationStatus: "VISIBLE" },
          select: { rating: true },
        },
      },
      orderBy: serviceOrderBy(filters.sort === "near_me" ? "relevance" : filters.sort),
      skip: origin ? 0 : skip,
      take: origin ? Math.min(200, pageSize * 5) : pageSize,
    }),
    prisma.service.count({ where }),
  ]);

  let mapped = services.map((s) => {
    const ratings = s.serviceReviews.map((r) => r.rating);
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : s.rating;
    const lat = s.provider.partnerProfile?.latitude ?? null;
    const lng = s.provider.partnerProfile?.longitude ?? null;
    const distanceKm =
      origin && lat != null && lng != null
        ? Math.round(haversineDistanceKm(origin, { lat, lng }) * 100) / 100
        : null;
    const { serviceReviews: _r, ...rest } = s;
    return {
      ...rest,
      rating: avg,
      reviewCount: ratings.length || s.reviewCount,
      distanceKm,
      city: s.city ?? s.provider.partnerProfile?.city ?? null,
    };
  });

  if (origin && filters.radiusKm && filters.radiusKm > 0) {
    mapped = mapped.filter((s) => s.distanceKm == null || s.distanceKm <= filters.radiusKm!);
  }

  if (origin && (filters.sort === "near_me" || filters.lat != null)) {
    mapped = mapped.sort((a, b) => {
      const da = a.distanceKm ?? Number.POSITIVE_INFINITY;
      const db = b.distanceKm ?? Number.POSITIVE_INFINITY;
      if (da !== db) return da - db;
      return b.rating - a.rating;
    });
  }

  const pageSlice = origin ? mapped.slice(skip, skip + pageSize) : mapped;
  const filteredTotal = origin ? mapped.length : total;

  return {
    services: pageSlice,
    total: filteredTotal,
    page,
    pageSize,
    totalPages: Math.ceil(filteredTotal / pageSize),
  };
}

export type PublicProductFilters = {
  q?: string;
  category?: string;
  species?: string;
  brand?: string;
  city?: string;
  state?: string;
  partnerId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  sort?: PublicSort;
  page?: number;
  pageSize?: number;
};

function productOrderBy(sort?: PublicSort): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "newest":
      return [{ createdAt: "desc" }];
    case "price_asc":
      return [{ price: "asc" }];
    case "price_desc":
      return [{ price: "desc" }];
    case "popular":
      return [{ reviewCount: "desc" }, { rating: "desc" }];
    case "rating":
      return [{ rating: "desc" }, { reviewCount: "desc" }];
    case "relevance":
    default:
      return [{ isFeatured: "desc" }, { rating: "desc" }, { createdAt: "desc" }];
  }
}

function serviceOrderBy(sort?: PublicSort): Prisma.ServiceOrderByWithRelationInput[] {
  switch (sort) {
    case "newest":
      return [{ createdAt: "desc" }];
    case "price_asc":
      return [{ price: "asc" }];
    case "price_desc":
      return [{ price: "desc" }];
    case "popular":
      return [{ reviewCount: "desc" }, { rating: "desc" }];
    case "rating":
      return [{ rating: "desc" }, { reviewCount: "desc" }];
    case "relevance":
    default:
      return [{ rating: "desc" }, { createdAt: "desc" }];
  }
}

export async function queryPublicProducts(filters: PublicProductFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 12));
  const skip = (page - 1) * pageSize;

  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    status: ProductCatalogStatus.ACTIVE,
    approvalStatus: "APPROVED",
    stock: filters.inStock === false ? undefined : { gt: 0 },
    seller: {
      accountStatus: AccountStatus.ACTIVE,
      role: "PARTNER" as const,
      partnerProfile: {
        is: {
          verificationStatus: VerificationStatus.APPROVED,
          approvedAt: { not: null },
          ...(filters.city ? { city: { contains: filters.city, mode: "insensitive" as const } } : {}),
          ...(filters.state ? { state: { equals: filters.state, mode: "insensitive" as const } } : {}),
        },
      },
    },
    ...(filters.category ? { catalogCategory: filters.category as never } : {}),
    ...(filters.species ? { speciesTarget: filters.species as never } : {}),
    ...(filters.brand ? { brand: { contains: filters.brand, mode: "insensitive" } } : {}),
    ...(filters.partnerId ? { sellerId: filters.partnerId } : {}),
    ...(filters.minPrice || filters.maxPrice
      ? {
          price: {
            ...(filters.minPrice ? { gte: filters.minPrice } : {}),
            ...(filters.maxPrice ? { lte: filters.maxPrice } : {}),
          },
        }
      : {}),
    ...(filters.minRating ? { rating: { gte: filters.minRating } } : {}),
    ...(filters.q
      ? {
          OR: [
            { name: { contains: filters.q, mode: "insensitive" } },
            { description: { contains: filters.q, mode: "insensitive" } },
            { brand: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const origin =
    filters.lat != null && filters.lng != null && isValidLatLng({ lat: filters.lat, lng: filters.lng })
      ? { lat: filters.lat, lng: filters.lng }
      : null;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            partnerProfile: {
              select: {
                businessName: true,
                city: true,
                state: true,
                latitude: true,
                longitude: true,
              },
            },
          },
        },
        reviews: { where: { moderationStatus: "VISIBLE" }, select: { rating: true } },
      },
      orderBy: productOrderBy(filters.sort === "near_me" ? "relevance" : filters.sort),
      skip: origin ? 0 : skip,
      take: origin ? Math.min(200, pageSize * 5) : pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  let mapped = products.map((p) => {
    const { reviews: _r, ...rest } = p;
    const lat = p.seller.partnerProfile?.latitude ?? null;
    const lng = p.seller.partnerProfile?.longitude ?? null;
    const distanceKm =
      origin && lat != null && lng != null
        ? Math.round(haversineDistanceKm(origin, { lat, lng }) * 100) / 100
        : null;
    // logisticsScore MVP: distância (menor melhor). Sem inventar frete/prazo.
    const distanceScore = distanceKm == null ? 0 : Math.max(0, 100 - distanceKm);
    return {
      ...rest,
      distanceKm,
      logisticsScore: distanceScore,
      shippingEtaLabel: "Prazo calculado no checkout" as const,
    };
  });

  if (origin && filters.radiusKm && filters.radiusKm > 0) {
    mapped = mapped.filter((p) => p.distanceKm == null || p.distanceKm <= filters.radiusKm!);
  }

  if (origin && (filters.sort === "near_me" || filters.lat != null)) {
    mapped.sort((a, b) => {
      const da = a.distanceKm ?? Number.POSITIVE_INFINITY;
      const db = b.distanceKm ?? Number.POSITIVE_INFINITY;
      if (da !== db) return da - db;
      return (b.logisticsScore ?? 0) - (a.logisticsScore ?? 0);
    });
  }

  const pageSlice = origin ? mapped.slice(skip, skip + pageSize) : mapped;
  const filteredTotal = origin ? mapped.length : total;

  return {
    products: pageSlice,
    total: filteredTotal,
    page,
    pageSize,
    totalPages: Math.ceil(filteredTotal / pageSize),
  };
}

export async function getPublicPartner(partnerId: string) {
  const partner = await prisma.user.findFirst({
    where: {
      id: partnerId,
      role: "PARTNER",
      accountStatus: AccountStatus.ACTIVE,
      partnerProfile: {
        is: {
          verificationStatus: VerificationStatus.APPROVED,
          approvedAt: { not: null },
        },
      },
    },
    select: {
      id: true,
      name: true,
      partnerProfile: {
        select: {
          businessName: true,
          description: true,
          city: true,
          state: true,
          category: true,
        },
      },
      services: {
        where: { deletedAt: null, status: PartnerServiceStatus.ACTIVE, isActive: true, approvalStatus: "APPROVED" },
        select: { id: true, name: true, description: true, price: true, category: true, rating: true, reviewCount: true, image: true },
      },
      products: {
        where: { deletedAt: null, status: ProductCatalogStatus.ACTIVE, approvalStatus: "APPROVED", stock: { gt: 0 } },
        select: { id: true, name: true, description: true, price: true, images: true, rating: true, reviewCount: true, catalogCategory: true },
      },
      partnerServiceReviews: {
        where: { moderationStatus: "VISIBLE" },
        select: { rating: true, comment: true, createdAt: true, user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
  if (!partner) return null;

  const ratings = partner.partnerServiceReviews.map((r) => r.rating);
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

  return {
    id: partner.id,
    businessName: partner.partnerProfile?.businessName ?? partner.name,
    description: partner.partnerProfile?.description,
    city: partner.partnerProfile?.city,
    state: partner.partnerProfile?.state,
    category: partner.partnerProfile?.category,
    services: partner.services,
    products: partner.products,
    reviews: partner.partnerServiceReviews,
    rating: avgRating,
    reviewCount: ratings.length,
  };
}

export type PublicPartnerFilters = {
  q?: string;
  category?: string;
  city?: string;
  state?: string;
  page?: number;
  pageSize?: number;
  lat?: number;
  lng?: number;
  radiusKm?: number;
};

export async function queryPublicPartners(filters: PublicPartnerFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 12));
  const skip = (page - 1) * pageSize;
  const origin =
    filters.lat != null && filters.lng != null && isValidLatLng({ lat: filters.lat, lng: filters.lng })
      ? { lat: filters.lat, lng: filters.lng }
      : null;

  const where: Prisma.UserWhereInput = {
    role: "PARTNER",
    accountStatus: AccountStatus.ACTIVE,
    partnerProfile: {
      is: {
        verificationStatus: VerificationStatus.APPROVED,
        ...(filters.category ? { category: { contains: filters.category, mode: "insensitive" as const } } : {}),
        ...(filters.city ? { city: { contains: filters.city, mode: "insensitive" as const } } : {}),
        ...(filters.state ? { state: { equals: filters.state, mode: "insensitive" as const } } : {}),
      },
    },
    ...(filters.q
      ? {
          OR: [
            { name: { contains: filters.q, mode: "insensitive" } },
            { partnerProfile: { businessName: { contains: filters.q, mode: "insensitive" } } },
            { partnerProfile: { description: { contains: filters.q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [partners, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        partnerProfile: {
          select: {
            businessName: true,
            description: true,
            city: true,
            state: true,
            category: true,
            latitude: true,
            longitude: true,
            formattedAddress: true,
          },
        },
        _count: {
          select: {
            products: {
              where: {
                deletedAt: null,
                status: ProductCatalogStatus.ACTIVE,
                approvalStatus: "APPROVED",
                stock: { gt: 0 },
              },
            },
            services: {
              where: {
                deletedAt: null,
                status: PartnerServiceStatus.ACTIVE,
                isActive: true,
                approvalStatus: "APPROVED",
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  let mapped = partners.map((p) => {
    const lat = p.partnerProfile?.latitude ?? null;
    const lng = p.partnerProfile?.longitude ?? null;
    const distanceKm =
      origin && lat != null && lng != null
        ? Math.round(haversineDistanceKm(origin, { lat, lng }) * 100) / 100
        : null;
    return {
      id: p.id,
      name: p.partnerProfile?.businessName ?? p.name,
      description: p.partnerProfile?.description,
      city: p.partnerProfile?.city,
      state: p.partnerProfile?.state,
      category: p.partnerProfile?.category,
      productCount: p._count.products,
      serviceCount: p._count.services,
      latitude: lat,
      longitude: lng,
      distanceKm,
    };
  });

  if (origin && filters.radiusKm && filters.radiusKm > 0) {
    mapped = mapped.filter((p) => p.distanceKm == null || p.distanceKm <= filters.radiusKm!);
  }

  if (origin) {
    mapped = mapped.sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }

  return {
    partners: mapped,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
