import { AccountStatus, PartnerServiceStatus, ProductCatalogStatus, Prisma, VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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
  page?: number;
  pageSize?: number;
};

export async function queryPublicServices(filters: PublicServiceFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 12));
  const skip = (page - 1) * pageSize;

  const where: Prisma.ServiceWhereInput = {
    deletedAt: null,
    status: PartnerServiceStatus.ACTIVE,
    isActive: true,
    approvalStatus: "APPROVED",
    provider: {
      accountStatus: AccountStatus.ACTIVE,
      role: "PARTNER" as const,
      ...(filters.city ? { partnerProfile: { city: { contains: filters.city, mode: "insensitive" } } } : {}),
      ...(filters.state ? { partnerProfile: { state: { equals: filters.state, mode: "insensitive" } } } : {}),
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
              select: { businessName: true, city: true, state: true, description: true },
            },
          },
        },
        serviceReviews: {
          where: { moderationStatus: "VISIBLE" },
          select: { rating: true },
        },
      },
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
      skip,
      take: pageSize,
    }),
    prisma.service.count({ where }),
  ]);

  return {
    services: services.map((s) => {
      const ratings = s.serviceReviews.map((r) => r.rating);
      const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : s.rating;
      const { serviceReviews: _r, ...rest } = s;
      return { ...rest, rating: avg, reviewCount: ratings.length || s.reviewCount };
    }),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
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
  page?: number;
  pageSize?: number;
};

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
      ...(filters.city ? { partnerProfile: { city: { contains: filters.city, mode: "insensitive" } } } : {}),
      ...(filters.state ? { partnerProfile: { state: { equals: filters.state, mode: "insensitive" } } } : {}),
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

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            partnerProfile: { select: { businessName: true, city: true, state: true } },
          },
        },
        reviews: { where: { moderationStatus: "VISIBLE" }, select: { rating: true } },
      },
      orderBy: [{ isFeatured: "desc" }, { rating: "desc" }, { createdAt: "desc" }],
      skip,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products.map((p) => {
      const { reviews: _r, ...rest } = p;
      return rest;
    }),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getPublicPartner(partnerId: string) {
  const partner = await prisma.user.findFirst({
    where: {
      id: partnerId,
      role: "PARTNER",
      accountStatus: AccountStatus.ACTIVE,
      partnerProfile: { isNot: null },
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
};

export async function queryPublicPartners(filters: PublicPartnerFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 12));
  const skip = (page - 1) * pageSize;

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

  return {
    partners: partners.map((p) => ({
      id: p.id,
      name: p.partnerProfile?.businessName ?? p.name,
      description: p.partnerProfile?.description,
      city: p.partnerProfile?.city,
      state: p.partnerProfile?.state,
      category: p.partnerProfile?.category,
      productCount: p._count.products,
      serviceCount: p._count.services,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
