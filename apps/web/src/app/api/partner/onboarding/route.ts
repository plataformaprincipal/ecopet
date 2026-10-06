import { apiSuccess } from "@/lib/api-response";
import { requirePartner } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";
import { evaluatePartnerOnboarding, maskFinancialDetails } from "@/lib/partner/onboarding";
import { getPartnerMpConnectionView } from "@/lib/mercado-pago/partner-oauth";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, error } = await requirePartner();
  if (error) return error;

  const [profile, mp] = await Promise.all([
    prisma.partnerProfile.findUnique({ where: { userId: user!.id } }),
    getPartnerMpConnectionView(user!.id),
  ]);

  const snapshot = evaluatePartnerOnboarding({
    accountStatus: user!.accountStatus,
    verificationStatus: profile?.verificationStatus,
    approvedAt: profile?.approvedAt,
    businessName: profile?.businessName,
    legalName: profile?.legalName,
    category: profile?.category,
    address: profile?.address,
    city: profile?.city,
    state: profile?.state,
    description: profile?.description,
    commercialEmail: profile?.commercialEmail,
    financialDetails: profile?.financialDetails,
    verificationDocuments: profile?.verificationDocuments,
    mpStatus: mp.status,
    mpUserId: mp.mpUserId,
  });

  return apiSuccess({
    snapshot,
    bank: maskFinancialDetails(profile?.financialDetails),
    mercadoPago: mp,
  });
}
