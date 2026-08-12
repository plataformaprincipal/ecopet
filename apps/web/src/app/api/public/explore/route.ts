import {
  AccountStatus,
  PartnerServiceStatus,
  ProductCatalogStatus,
  VerificationStatus,
  type Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { queryPublicProducts, queryPublicServices, queryPublicPartners } from "@/lib/marketplace/public-query";

const approvedPartnerFilter: Prisma.UserWhereInput = {
  role: "PARTNER",
  accountStatus: AccountStatus.ACTIVE,
  partnerProfile: {
    is: { verificationStatus: VerificationStatus.APPROVED },
  },
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category") ?? undefined;
  const q = url.searchParams.get("q") ?? undefined;

  const wantsProductsOnly = category === "produtos";
  const wantsServicesOnly =
    category === "servicos" || category === "banho-tosa" || category === "veterinarios";
  const wantsPartnersOnly = category === "pet-shops";
  const wantsAdoptionsOnly = category === "adocao";

  const [
    productsPreview,
    servicesPreview,
    partnersPreview,
    productCount,
    serviceCount,
    partnerCount,
    adoptionCount,
    adoptionsPreview,
  ] = await Promise.all([
    wantsServicesOnly || wantsPartnersOnly || wantsAdoptionsOnly
      ? Promise.resolve({ products: [] as Awaited<ReturnType<typeof queryPublicProducts>>["products"] })
      : queryPublicProducts({ q, pageSize: 6 }),
    wantsProductsOnly || wantsPartnersOnly || wantsAdoptionsOnly
      ? Promise.resolve({ services: [] as Awaited<ReturnType<typeof queryPublicServices>>["services"] })
      : queryPublicServices({
          category:
            category === "banho-tosa"
              ? "BATH_GROOMING"
              : category === "veterinarios"
                ? "VET_CONSULTATION"
                : undefined,
          q,
          pageSize: 6,
        }),
    wantsProductsOnly || wantsServicesOnly || wantsAdoptionsOnly
      ? Promise.resolve({ partners: [] as Awaited<ReturnType<typeof queryPublicPartners>>["partners"] })
      : queryPublicPartners({
          category:
            category === "pet-shops"
              ? "PETSHOP"
              : category === "veterinarios"
                ? "VETERINARY"
                : undefined,
          q,
          pageSize: 6,
        }),
    prisma.product.count({
      where: {
        deletedAt: null,
        status: ProductCatalogStatus.ACTIVE,
        approvalStatus: "APPROVED",
        stock: { gt: 0 },
        seller: approvedPartnerFilter,
      },
    }),
    prisma.service.count({
      where: {
        deletedAt: null,
        status: PartnerServiceStatus.ACTIVE,
        isActive: true,
        provider: approvedPartnerFilter,
      },
    }),
    prisma.user.count({ where: approvedPartnerFilter }),
    prisma.adoptionListing.count({
      where: {
        status: "AVAILABLE",
        ong: {
          accountStatus: AccountStatus.ACTIVE,
          ongProfile: { is: { verificationStatus: VerificationStatus.APPROVED } },
        },
      },
    }),
    wantsProductsOnly || wantsServicesOnly || wantsPartnersOnly
      ? Promise.resolve([] as Array<{ id: string; name: string; species: string }>)
      : prisma.adoptionListing.findMany({
          where: {
            status: "AVAILABLE",
            ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
            ong: {
              accountStatus: AccountStatus.ACTIVE,
              ongProfile: { is: { verificationStatus: VerificationStatus.APPROVED } },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 6,
          select: { id: true, name: true, species: true },
        }),
  ]);

  return apiSuccess({
    counts: {
      products: productCount,
      services: serviceCount,
      partners: partnerCount,
      adoptions: adoptionCount,
    },
    products: productsPreview.products,
    services: servicesPreview.services,
    partners: partnersPreview.partners,
    adoptions: adoptionsPreview,
  });
}
