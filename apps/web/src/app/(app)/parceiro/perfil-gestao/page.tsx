import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { prisma } from "@/lib/prisma";
import { getPartnerAccessLevel } from "@/lib/partner/access";
import { PartnerProfileManagementPage } from "@/components/features/partner/pages/partner-profile-management-page";

export default async function PerfilGestaoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/parceiro/perfil-gestao");
  if (user.role !== UserRole.PARTNER) redirect(dashboardPathForRole(user.role));

  const partnerProfile = await prisma.partnerProfile.findUnique({
    where: { userId: user.id },
    select: { verificationStatus: true },
  });

  const accessLevel = getPartnerAccessLevel({
    accountStatus: user.accountStatus,
    verificationStatus: partnerProfile?.verificationStatus,
  });

  return (
    <PartnerProfileManagementPage
      user={{
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        accountStatus: user.accountStatus,
      }}
      accessLevel={accessLevel}
      verificationStatus={partnerProfile?.verificationStatus}
    />
  );
}
