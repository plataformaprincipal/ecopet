import { AccountStatus, VerificationStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { evaluateOngOnboarding } from "@/lib/ong/onboarding";
import { evaluatePartnerOnboarding, SELLER_NOT_ENABLED_MESSAGE } from "@/lib/partner/onboarding";
import { isExternalMarketplaceRole, requiresExternalSellerGate } from "@/lib/seller/platform";

export { SELLER_NOT_ENABLED_MESSAGE };
export { requiresExternalSellerGate, isPlatformSellerId, isExternalMarketplaceRole } from "@/lib/seller/platform";

/** True when this seller must be MP CONNECTED before checkout can charge. */
export async function sellerRequiresMarketplaceSplit(sellerId: string | null | undefined): Promise<boolean> {
  if (!requiresExternalSellerGate({ sellerId })) return false;
  const user = await prisma.user.findUnique({
    where: { id: sellerId as string },
    select: { role: true },
  });
  return requiresExternalSellerGate({ sellerId, role: user?.role ?? null });
}

export async function listConnectedPartnerIds(): Promise<string[]> {
  const rows = await prisma.partnerMpConnection.findMany({
    where: { status: "CONNECTED", mpUserId: { not: null } },
    select: { partnerId: true },
  });
  return rows.map((row) => row.partnerId);
}

/** Where de User seller elegível para venda (ACTIVE + docs + MP CONNECTED). */
export async function sellableSellerWhere(
  extraProfile?: Prisma.PartnerProfileWhereInput
): Promise<Prisma.UserWhereInput> {
  const ids = await listConnectedPartnerIds();
  if (ids.length === 0) {
    return { id: { in: ["__none__"] } };
  }
  return {
    role: { in: ["PARTNER", "ONG"] },
    accountStatus: AccountStatus.ACTIVE,
    id: { in: ids },
    OR: [
      {
        role: "PARTNER",
        partnerProfile: {
          is: {
            verificationStatus: VerificationStatus.APPROVED,
            approvedAt: { not: null },
            ...extraProfile,
          },
        },
      },
      {
        role: "ONG",
        ongProfile: {
          is: {
            verificationStatus: VerificationStatus.APPROVED,
            approvedAt: { not: null },
          },
        },
      },
    ],
  };
}

/** Um único par de queries para revalidar o carrinho sem N+1 por item. */
export async function listSellablePartnerIdSet(): Promise<Set<string>> {
  const where = await sellableSellerWhere();
  const rows = await prisma.user.findMany({ where, select: { id: true } });
  return new Set(rows.map((row) => row.id));
}

export async function isSellerSellable(sellerId: string): Promise<boolean> {
  const [user, connection] = await Promise.all([
    prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        role: true,
        accountStatus: true,
        partnerProfile: {
          select: {
            verificationStatus: true,
            approvedAt: true,
            businessName: true,
            legalName: true,
            category: true,
            address: true,
            city: true,
            description: true,
            financialDetails: true,
            verificationDocuments: true,
          },
        },
        ongProfile: {
          select: {
            verificationStatus: true,
            approvedAt: true,
            name: true,
            ongName: true,
            address: true,
            city: true,
            description: true,
            focusArea: true,
            documents: true,
            profileDetails: true,
          },
        },
      },
    }),
    prisma.partnerMpConnection.findUnique({
      where: { partnerId: sellerId },
      select: { status: true, mpUserId: true },
    }),
  ]);
  if (!user) return false;
  if (!isExternalMarketplaceRole(user.role)) {
    return user.accountStatus === AccountStatus.ACTIVE;
  }
  if (user.role === "ONG" && user.ongProfile) {
    const details = (user.ongProfile.profileDetails ?? {}) as Record<string, unknown>;
    return evaluateOngOnboarding({
      accountStatus: user.accountStatus,
      verificationStatus: user.ongProfile.verificationStatus,
      approvedAt: user.ongProfile.approvedAt,
      name: user.ongProfile.name,
      ongName: user.ongProfile.ongName,
      address: user.ongProfile.address,
      city: user.ongProfile.city,
      description: user.ongProfile.description,
      focusArea: user.ongProfile.focusArea,
      documents: user.ongProfile.documents,
      profileDetails: user.ongProfile.profileDetails,
      financialDetails: details.financialDetails,
      mpStatus: connection?.status,
      mpUserId: connection?.mpUserId,
    }).sellable;
  }
  if (!user.partnerProfile) return false;
  const snapshot = evaluatePartnerOnboarding({
    accountStatus: user.accountStatus,
    verificationStatus: user.partnerProfile.verificationStatus,
    approvedAt: user.partnerProfile.approvedAt,
    businessName: user.partnerProfile.businessName,
    legalName: user.partnerProfile.legalName,
    category: user.partnerProfile.category,
    address: user.partnerProfile.address,
    city: user.partnerProfile.city,
    description: user.partnerProfile.description,
    financialDetails: user.partnerProfile.financialDetails,
    verificationDocuments: user.partnerProfile.verificationDocuments,
    mpStatus: connection?.status,
    mpUserId: connection?.mpUserId,
  });
  return snapshot.sellable;
}
