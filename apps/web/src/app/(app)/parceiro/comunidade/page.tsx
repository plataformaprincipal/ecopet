import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { prisma } from "@/lib/prisma";
import { getPartnerAccessLevel } from "@/lib/partner/access";
import { PartnerCommunityPage } from "@/components/features/partner/pages/partner-community-page";

export default async function ComunidadePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/parceiro/comunidade");
  if (user.role !== UserRole.PARTNER) redirect(dashboardPathForRole(user.role));

  const partnerProfile = await prisma.partnerProfile.findUnique({
    where: { userId: user.id },
    select: { verificationStatus: true },
  });

  const accessLevel = getPartnerAccessLevel({
    accountStatus: user.accountStatus,
    verificationStatus: partnerProfile?.verificationStatus,
  });

  return <PartnerCommunityPage partnerId={user.id} accessLevel={accessLevel} />;
}
