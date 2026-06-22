import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { requireActivePartner } from "@/lib/auth/require-auth";
import { buildPartnerDashboardSummary } from "@/lib/partner/ai-insights";
import { getPartnerAccessLevel } from "@/lib/partner/access";

export async function GET() {
  const { user, error } = await requireActivePartner();
  if (error) return error;

  const partnerProfile = await prisma.partnerProfile.findUnique({
    where: { userId: user!.id },
    select: { verificationStatus: true },
  });

  const accessLevel = getPartnerAccessLevel({
    accountStatus: user!.accountStatus,
    verificationStatus: partnerProfile?.verificationStatus,
  });

  if (accessLevel !== "full") {
    return apiSuccess({
      locked: true,
      summary: null,
    });
  }

  const summary = await buildPartnerDashboardSummary(prisma, user!.id);
  return apiSuccess({ locked: false, summary });
}
