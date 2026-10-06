import { apiSuccess } from "@/lib/api-response";
import { requireOng } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";
import { evaluateOngOnboarding } from "@/lib/ong/onboarding";
import { maskFinancialDetails } from "@/lib/partner/onboarding";
import { getPartnerMpConnectionView } from "@/lib/mercado-pago/partner-oauth";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, error } = await requireOng();
  if (error) return error;

  const [profile, mp] = await Promise.all([
    prisma.ongProfile.findUnique({ where: { userId: user!.id } }),
    getPartnerMpConnectionView(user!.id),
  ]);
  const details = (profile?.profileDetails ?? {}) as Record<string, unknown>;

  const snapshot = evaluateOngOnboarding({
    accountStatus: user!.accountStatus,
    verificationStatus: profile?.verificationStatus,
    approvedAt: profile?.approvedAt,
    name: profile?.name,
    ongName: profile?.ongName,
    responsible: profile?.responsible,
    address: profile?.address,
    city: profile?.city,
    description: profile?.description,
    focusArea: profile?.focusArea,
    documents: profile?.documents,
    profileDetails: profile?.profileDetails,
    financialDetails: details.financialDetails,
    mpStatus: mp.status,
    mpUserId: mp.mpUserId,
  });

  return apiSuccess({
    snapshot,
    bank: maskFinancialDetails(details.financialDetails),
    mercadoPago: mp,
  });
}
