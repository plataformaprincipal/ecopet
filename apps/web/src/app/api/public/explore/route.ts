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

  const [
    productsPreview,
    servicesPreview,
    partnersPreview,
    productCount,
    serviceCount,
    partnerCount,
    adoptionCount,
  ] = await Promise.all([
    queryPublicProducts({ q, pageSize: 6 }),
    queryPublicServices({
      category:
        category === "banho-tosa"
          ? "BATH_GROOMING"
          : category === "veterinarios"
            ? "VET_CONSULTATION"
            : undefined,
      q,
      pageSize: 6,
    }),
    queryPublicPartners({
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
    prisma.user.count({
      where: {
        role: "ONG",
        accountStatus: AccountStatus.ACTIVE,
        ongProfile: {
          is: { verificationStatus: VerificationStatus.APPROVED },
        },
      },
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
  });
}
