import { AccountStatus, PartnerServiceStatus, ProductCatalogStatus, Prisma, VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { boundingBox, haversineDistanceKm } from "@/lib/google-maps/distance";
import { isValidLatLng } from "@/lib/google-maps/validation";
import {
  compareFastestDelivery,
  compareNearMe,
  compareShippingCost,
  compareTotalCost,
  isWithinRadius,
  relevanceScore,
  textMatchScore,
} from "@/lib/marketplace/ranking";
import { publicPartnerAccountWhere, publicVerificationWhere } from "@/lib/marketplace/parse-request";
import { MARKETPLACE_FEATURES } from "@/lib/marketplace/query-model";
import { serviceEnumsForGroup, getServiceVertical } from "@/lib/marketplace/service-verticals";
import { compareServiceValue, isOpenOnWeekday, servicePersonalizationScore, weekdayInSaoPaulo } from "@/lib/marketplace/service-personalize";

export type PublicSort =
  | "relevance"
  | "newest"
  | "price_asc"
  | "price_desc"
  | "popular"
  | "rating"
  | "near_me"
  | "total_cost"
  | "shipping_cost"
  | "fastest_delivery"
  | "value";

type Origin = { lat: number; lng: number };

function originFrom(filters: { lat?: number; lng?: number }): Origin | null {
  return filters.lat != null && filters.lng != null && isValidLatLng({ lat: filters.lat, lng: filters.lng })
    ? { lat: filters.lat, lng: filters.lng }
    : null;
}

function geoProfileWhere(origin: Origin | null, radiusKm?: number): Prisma.PartnerProfileWhereInput {
  if (!origin || !radiusKm || radiusKm <= 0) return {};
  const box = boundingBox(origin, radiusKm);
  return {
    latitude: { gte: box.minLat, lte: box.maxLat },
    longitude: { gte: box.minLng, lte: box.maxLng },
  };
}

function distanceKm(origin: Origin | null, lat: number | null | undefined, lng: number | null | undefined): number | null {
  if (!origin || lat == null || lng == null) return null;
  return Math.round(haversineDistanceKm(origin, { lat, lng }) * 100) / 100;
}

function stripCoords<T extends { latitude?: number | null; longitude?: number | null }>(profile: T | null | undefined) {
  if (!profile) return profile ?? null;
  const { latitude: _lat, longitude: _lng, ...rest } = profile;
  return rest;
}

function isVerifiedStatus(status?: VerificationStatus | null, approvedAt?: Date | null) {
  return status === VerificationStatus.APPROVED && approvedAt != null;
}

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
    default:
      return [{ createdAt: "desc" }];
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
    default:
      return [{ createdAt: "desc" }];
  }
}

function needsInMemoryPage(sort?: PublicSort, origin?: Origin | null, extra = false) {
  return (
    Boolean(origin) ||
    extra ||
    sort === "total_cost" ||
    sort === "shipping_cost" ||
    sort === "fastest_delivery" ||
    sort === "near_me" ||
    sort === "relevance" ||
    sort === "value"
  );
}

function dbSort(sort?: PublicSort): PublicSort | undefined {
  if (!sort || sort === "near_me" || sort === "total_cost" || sort === "shipping_cost" || sort === "fastest_delivery" || sort === "relevance" || sort === "value") {
    return "newest";
  }
  return sort;
}

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
  homeService?: boolean;
  verifiedOnly?: boolean;
  openToday?: boolean;
  group?: string;
  categories?: string[];
  lat?: number;
  lng?: number;
  radiusKm?: number;
  sort?: PublicSort;
  page?: number;
  pageSize?: number;
};

const partnerProfileSelect = {
  businessName: true,
  city: true,
  state: true,
  description: true,
  category: true,
  latitude: true,
  longitude: true,
  verificationStatus: true,
  approvedAt: true,
} as const;

function resolveServiceCategories(filters: PublicServiceFilters): string | string[] | undefined {
  if (filters.emergency24h) return "EMERGENCY_24H";
  if (filters.category) return filters.category;
  if (filters.categories?.length) return filters.categories.length === 1 ? filters.categories[0] : filters.categories;
  const fromGroup = serviceEnumsForGroup(filters.group);
  if (fromGroup?.length) return fromGroup.length === 1 ? fromGroup[0] : fromGroup;
  return undefined;
}

export async function queryPublicServices(filters: PublicServiceFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 12));
  const skip = (page - 1) * pageSize;
  const origin = originFrom(filters);
  const todayWeekday = weekdayInSaoPaulo();
  const categoryFilter = resolveServiceCategories(filters);
  if (getServiceVertical(filters.group)?.kind === "empty") {
    return { services: [], total: 0, page, pageSize, totalPages: 1 };
  }
  const inMemory = needsInMemoryPage(filters.sort, origin, Boolean(filters.q) || Boolean(filters.species));

  const extraAnd: Prisma.ServiceWhereInput[] = [];
  if (filters.q) {
    extraAnd.push({
      OR: [
        { name: { contains: filters.q, mode: "insensitive" } },
        { description: { contains: filters.q, mode: "insensitive" } },
        { provider: { name: { contains: filters.q, mode: "insensitive" } } },
        { provider: { partnerProfile: { is: { businessName: { contains: filters.q, mode: "insensitive" } } } } },
      ],
    });
  }
  if (filters.species) {
    extraAnd.push({
      OR: [{ speciesTarget: filters.species as never }, { speciesTarget: null }],
    });
  }

  const where: Prisma.ServiceWhereInput = {
    deletedAt: null,
    status: PartnerServiceStatus.ACTIVE,
    isActive: true,
    approvalStatus: "APPROVED",
    provider: {
      ...publicPartnerAccountWhere,
      partnerProfile: {
        is: {
          ...publicVerificationWhere(filters.verifiedOnly),
          ...geoProfileWhere(origin, filters.radiusKm),
          ...(filters.city ? { city: { contains: filters.city, mode: "insensitive" as const } } : {}),
          ...(filters.state ? { state: { equals: filters.state, mode: "insensitive" as const } } : {}),
          ...(filters.openToday
            ? { availabilitySlots: { some: { isActive: true, weekday: todayWeekday } } }
            : {}),
        },
      },
    },
    ...(typeof categoryFilter === "string"
      ? { category: categoryFilter as never }
      : Array.isArray(categoryFilter)
        ? { category: { in: categoryFilter as never } }
        : {}),
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
    ...(filters.homeService ? { modality: { in: ["HOME" as const, "PICKUP_DELIVERY" as const] } } : {}),
    ...(extraAnd.length ? { AND: extraAnd } : {}),
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
                ...partnerProfileSelect,
                availabilitySlots: { where: { isActive: true }, select: { weekday: true, isActive: true } },
              },
            },
          },
        },
        serviceReviews: {
          where: { moderationStatus: "VISIBLE" },
          select: { rating: true },
        },
      },
      orderBy: serviceOrderBy(dbSort(filters.sort)),
      skip: inMemory ? 0 : skip,
      take: inMemory ? Math.min(200, pageSize * 8) : pageSize,
    }),
    prisma.service.count({ where }),
  ]);

  let mapped = services.map((s) => {
    const ratings = s.serviceReviews.map((r) => r.rating);
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : s.rating;
    const reviewCount = ratings.length || s.reviewCount;
    const lat = s.provider.partnerProfile?.latitude ?? null;
    const lng = s.provider.partnerProfile?.longitude ?? null;
    const dist = distanceKm(origin, lat, lng);
    const verified = isVerifiedStatus(s.provider.partnerProfile?.verificationStatus, s.provider.partnerProfile?.approvedAt);
    const slots = s.provider.partnerProfile?.availabilitySlots;
    const openToday = isOpenOnWeekday(slots, todayWeekday);
    const { serviceReviews: _r, ...rest } = s;
    const categoryMatch = Boolean(
      (typeof categoryFilter === "string" && String(s.category) === categoryFilter) ||
        (Array.isArray(categoryFilter) && categoryFilter.includes(String(s.category)))
    );
    const score = filters.species
      ? servicePersonalizationScore({
          petSpecies: filters.species,
          serviceSpecies: s.speciesTarget,
          distanceKm: dist,
          rating: avg,
          reviewCount,
          openToday,
          price: s.price,
          verified,
        })
      : relevanceScore({
          textMatch: textMatchScore(filters.q, [s.name, s.description, s.provider.partnerProfile?.businessName, s.provider.name]),
          categoryMatch,
          available: s.isActive,
          rating: avg,
          reviewCount,
          verified,
          distanceKm: dist,
        });
    const profileRaw = s.provider.partnerProfile;
    const profile = profileRaw
      ? stripCoords((({ availabilitySlots: _slots, ...rest }) => rest)(profileRaw))
      : null;
    return {
      ...rest,
      rating: avg,
      reviewCount,
      distanceKm: dist,
      shippingCost: null as number | null,
      shippingDays: null as number | null,
      city: s.city ?? s.provider.partnerProfile?.city ?? null,
      isVerified: verified,
      openToday,
      provider: {
        ...s.provider,
        partnerProfile: profile,
      },
      _score: score,
    };
  });

  if (origin && filters.radiusKm && filters.radiusKm > 0) {
    mapped = mapped.filter((s) => isWithinRadius(s.distanceKm, filters.radiusKm));
  }

  mapped = sortMapped(mapped, filters.sort);

  const pageSlice = inMemory ? mapped.slice(skip, skip + pageSize) : mapped;
  const filteredTotal = inMemory ? mapped.length : total;

  return {
    services: pageSlice.map(({ _score: _s, ...row }) => row),
    total: filteredTotal,
    page,
    pageSize,
    totalPages: Math.ceil(filteredTotal / pageSize) || 1,
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
  verifiedOnly?: boolean;
  freeShipping?: boolean;
  promoOnly?: boolean;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  sort?: PublicSort;
  page?: number;
  pageSize?: number;
};

export async function queryPublicProducts(filters: PublicProductFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 12));
  const skip = (page - 1) * pageSize;
  const origin = originFrom(filters);
  const inMemory = needsInMemoryPage(filters.sort, origin, Boolean(filters.q) || Boolean(filters.promoOnly));

  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    status: ProductCatalogStatus.ACTIVE,
    approvalStatus: "APPROVED",
    stock: filters.inStock === false ? undefined : { gt: 0 },
    seller: {
      ...publicPartnerAccountWhere,
      partnerProfile: {
        is: {
          ...publicVerificationWhere(filters.verifiedOnly),
          ...geoProfileWhere(origin, filters.radiusKm),
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
    ...(filters.promoOnly ? { comparePrice: { not: null, gt: 0 } } : {}),
    ...(filters.q
      ? {
          OR: [
            { name: { contains: filters.q, mode: "insensitive" } },
            { description: { contains: filters.q, mode: "insensitive" } },
            { brand: { contains: filters.q, mode: "insensitive" } },
            { seller: { name: { contains: filters.q, mode: "insensitive" } } },
            { seller: { partnerProfile: { is: { businessName: { contains: filters.q, mode: "insensitive" } } } } },
          ],
        }
      : {}),
  };

  if (MARKETPLACE_FEATURES.freeShipping && filters.freeShipping) {
    // Sem shippingCost no Product — não inventar. Flag desligada por padrão.
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            partnerProfile: { select: partnerProfileSelect },
          },
        },
        reviews: { where: { moderationStatus: "VISIBLE" }, select: { rating: true } },
      },
      orderBy: productOrderBy(dbSort(filters.sort)),
      skip: inMemory ? 0 : skip,
      take: inMemory ? Math.min(200, pageSize * 8) : pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  let mapped = products.map((p) => {
    const ratings = p.reviews.map((r) => r.rating);
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : p.rating;
    const reviewCount = ratings.length || p.reviewCount;
    const lat = p.seller.partnerProfile?.latitude ?? null;
    const lng = p.seller.partnerProfile?.longitude ?? null;
    const dist = distanceKm(origin, lat, lng);
    const verified = isVerifiedStatus(p.seller.partnerProfile?.verificationStatus, p.seller.partnerProfile?.approvedAt);
    const { reviews: _r, ...rest } = p;
    const isPromo = p.comparePrice != null && p.comparePrice > p.price;
    const score = relevanceScore({
      textMatch: textMatchScore(filters.q, [p.name, p.description, p.brand, p.seller.partnerProfile?.businessName, p.seller.name]),
      categoryMatch: Boolean(filters.category && String(p.catalogCategory) === filters.category),
      available: p.stock > 0,
      rating: avg,
      reviewCount,
      verified,
      distanceKm: dist,
    });
    return {
      ...rest,
      rating: avg,
      reviewCount,
      distanceKm: dist,
      shippingCost: null as number | null,
      shippingDays: null as number | null,
      shippingEtaLabel: "Prazo calculado no checkout" as const,
      isPromo,
      isVerified: verified,
      seller: {
        ...p.seller,
        partnerProfile: stripCoords(p.seller.partnerProfile),
      },
      _score: score,
    };
  });

  if (filters.promoOnly) {
    mapped = mapped.filter((p) => p.isPromo);
  }

  if (origin && filters.radiusKm && filters.radiusKm > 0) {
    mapped = mapped.filter((p) => isWithinRadius(p.distanceKm, filters.radiusKm));
  }

  mapped = sortMapped(mapped, filters.sort);

  const pageSlice = inMemory ? mapped.slice(skip, skip + pageSize) : mapped;
  const filteredTotal = inMemory ? mapped.length : total;

  return {
    products: pageSlice.map(({ _score: _s, ...row }) => row),
    total: filteredTotal,
    page,
    pageSize,
    totalPages: Math.ceil(filteredTotal / pageSize) || 1,
  };
}

type RankedRow = {
  _score: number;
  distanceKm: number | null;
  price?: number;
  shippingCost: number | null;
  shippingDays: number | null;
  rating?: number;
  reviewCount?: number;
  createdAt?: Date;
};

function sortMapped<T extends RankedRow>(rows: T[], sort?: PublicSort): T[] {
  const list = [...rows];
  if (sort === "near_me") {
    list.sort((a, b) => compareNearMe(a, b) || b._score - a._score);
    return list;
  }
  if (sort === "value") {
    list.sort((a, b) =>
      compareServiceValue(
        { rating: a.rating ?? 0, reviewCount: a.reviewCount ?? 0, price: a.price ?? 0 },
        { rating: b.rating ?? 0, reviewCount: b.reviewCount ?? 0, price: b.price ?? 0 }
      ) || b._score - a._score
    );
    return list;
  }
  if (sort === "total_cost") {
    list.sort((a, b) =>
      compareTotalCost(
        { price: a.price ?? 0, shippingCost: a.shippingCost },
        { price: b.price ?? 0, shippingCost: b.shippingCost }
      )
    );
    return list;
  }
  if (sort === "shipping_cost") {
    list.sort((a, b) => compareShippingCost({ price: a.price ?? 0, shippingCost: a.shippingCost }, { price: b.price ?? 0, shippingCost: b.shippingCost }));
    return list;
  }
  if (sort === "fastest_delivery") {
    list.sort((a, b) => compareFastestDelivery(a, b) || compareNearMe(a, b));
    return list;
  }
  if (sort === "relevance") {
    list.sort((a, b) => b._score - a._score);
    return list;
  }
  return list;
}

export async function getPublicPartner(partnerId: string) {
  const partner = await prisma.user.findFirst({
    where: {
      id: partnerId,
      ...publicPartnerAccountWhere,
      partnerProfile: { is: {} },
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
          verificationStatus: true,
          approvedAt: true,
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
  const verified = isVerifiedStatus(partner.partnerProfile?.verificationStatus, partner.partnerProfile?.approvedAt);

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
    isVerified: verified,
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
  verifiedOnly?: boolean;
  minRating?: number;
  sort?: PublicSort;
};

export async function queryPublicPartners(filters: PublicPartnerFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 12));
  const skip = (page - 1) * pageSize;
  const origin = originFrom(filters);
  const inMemory = needsInMemoryPage(filters.sort, origin, Boolean(filters.q) || Boolean(filters.minRating));

  const where: Prisma.UserWhereInput = {
    ...publicPartnerAccountWhere,
    partnerProfile: {
      is: {
        ...publicVerificationWhere(filters.verifiedOnly),
        ...geoProfileWhere(origin, filters.radiusKm),
        ...(filters.category ? { category: { contains: filters.category, mode: "insensitive" as const } } : {}),
        ...(filters.city ? { city: { contains: filters.city, mode: "insensitive" as const } } : {}),
        ...(filters.state ? { state: { equals: filters.state, mode: "insensitive" as const } } : {}),
      },
    },
    ...(filters.q
      ? {
          OR: [
            { name: { contains: filters.q, mode: "insensitive" } },
            { partnerProfile: { is: { businessName: { contains: filters.q, mode: "insensitive" } } } },
            { partnerProfile: { is: { description: { contains: filters.q, mode: "insensitive" } } } },
            { partnerProfile: { is: { category: { contains: filters.q, mode: "insensitive" } } } },
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
        createdAt: true,
        partnerProfile: { select: partnerProfileSelect },
        partnerServiceReviews: {
          where: { moderationStatus: "VISIBLE" },
          select: { rating: true },
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
      skip: inMemory ? 0 : skip,
      take: inMemory ? Math.min(200, pageSize * 8) : pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  let mapped = partners.map((p) => {
    const lat = p.partnerProfile?.latitude ?? null;
    const lng = p.partnerProfile?.longitude ?? null;
    const dist = distanceKm(origin, lat, lng);
    const ratings = p.partnerServiceReviews.map((r) => r.rating);
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    const verified = isVerifiedStatus(p.partnerProfile?.verificationStatus, p.partnerProfile?.approvedAt);
    const score = relevanceScore({
      textMatch: textMatchScore(filters.q, [p.name, p.partnerProfile?.businessName, p.partnerProfile?.description, p.partnerProfile?.category]),
      categoryMatch: Boolean(filters.category && (p.partnerProfile?.category ?? "").toLowerCase().includes(filters.category.toLowerCase())),
      available: true,
      rating: avg,
      reviewCount: ratings.length,
      verified,
      distanceKm: dist,
    });
    return {
      id: p.id,
      name: p.partnerProfile?.businessName ?? p.name,
      description: p.partnerProfile?.description,
      city: p.partnerProfile?.city,
      state: p.partnerProfile?.state,
      category: p.partnerProfile?.category,
      productCount: p._count.products,
      serviceCount: p._count.services,
      distanceKm: dist,
      rating: avg,
      reviewCount: ratings.length,
      isVerified: verified,
      shippingCost: null as number | null,
      shippingDays: null as number | null,
      price: undefined as number | undefined,
      createdAt: p.createdAt,
      _score: score,
    };
  });

  if (filters.minRating) {
    mapped = mapped.filter((p) => p.rating >= filters.minRating!);
  }
  if (origin && filters.radiusKm && filters.radiusKm > 0) {
    mapped = mapped.filter((p) => isWithinRadius(p.distanceKm, filters.radiusKm));
  }

  mapped = sortMapped(mapped, filters.sort);

  const pageSlice = inMemory ? mapped.slice(skip, skip + pageSize) : mapped;
  const filteredTotal = inMemory ? mapped.length : total;

  return {
    partners: pageSlice.map(({ _score: _s, createdAt: _c, shippingCost: _sc, shippingDays: _sd, price: _p, ...row }) => row),
    total: filteredTotal,
    page,
    pageSize,
    totalPages: Math.ceil(filteredTotal / pageSize) || 1,
  };
}
