import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { prisma } from "@/lib/prisma";
import { getPartnerAccessLevel } from "@/lib/partner/access";
import { PartnerSocialErpPage } from "@/components/features/partner/erp/partner-social-erp-page";

export default async function PartnerSocialRoute() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/partner/social");
  if (user.role !== UserRole.PARTNER) redirect(dashboardPathForRole(user.role));

  const profile = await prisma.partnerProfile.findUnique({
    where: { userId: user.id },
    select: { verificationStatus: true },
  });
  const accessLevel = getPartnerAccessLevel({
    accountStatus: user.accountStatus,
    verificationStatus: profile?.verificationStatus,
  });

  return <PartnerSocialErpPage partnerId={user.id} accessLevel={accessLevel} />;
}
