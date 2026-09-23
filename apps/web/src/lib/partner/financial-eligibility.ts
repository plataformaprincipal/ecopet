import "server-only";

import { prisma } from "@/lib/prisma";
import { evaluatePartnerFinancialDetails } from "@/lib/partner/financial-eligibility-policy";

export { evaluatePartnerFinancialDetails } from "@/lib/partner/financial-eligibility-policy";
export type { PartnerFinancialStatus } from "@/lib/partner/financial-eligibility-policy";

export async function getPartnerFinancialEligibility(partnerId: string) {
  const profile = await prisma.partnerProfile.findUnique({
    where: { userId: partnerId },
    select: { financialDetails: true },
  });
  return evaluatePartnerFinancialDetails(profile?.financialDetails);
}
