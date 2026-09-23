import "server-only";

import { prisma } from "@/lib/prisma";
import { getPartnerMpConnectionView } from "@/lib/mercado-pago/partner-oauth";
import { evaluatePartnerFinancialDetails } from "@/lib/partner/financial-eligibility-policy";

export { evaluatePartnerFinancialDetails } from "@/lib/partner/financial-eligibility-policy";
export type { PartnerFinancialStatus } from "@/lib/partner/financial-eligibility-policy";

export async function getPartnerFinancialEligibility(partnerId: string) {
  const [profile, connection] = await Promise.all([
    prisma.partnerProfile.findUnique({
      where: { userId: partnerId },
      select: { financialDetails: true },
    }),
    getPartnerMpConnectionView(partnerId),
  ]);
  const legacy = evaluatePartnerFinancialDetails(profile?.financialDetails);
  // Bank details stay on record for compliance, but Marketplace publication requires seller OAuth.
  if (connection.status === "CONNECTED" && connection.mpUserId) {
    return { status: "ACTIVE" as const, canPublish: true, connection };
  }
  return { ...legacy, canPublish: false, connection };
}
