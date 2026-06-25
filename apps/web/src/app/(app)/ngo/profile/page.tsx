import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { prisma } from "@/lib/prisma";
import { getOngAccessLevel } from "@/lib/ong/access";
import { OngProfileManagementPage } from "@/components/features/ong/pages/ong-profile-management-page";

export default async function NgoProfileRoute() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/ngo/profile");
  if (user.role !== UserRole.ONG) redirect(dashboardPathForRole(user.role));

  const ongProfile = await prisma.ongProfile.findUnique({
    where: { userId: user.id },
    select: { verificationStatus: true },
  });

  const accessLevel = getOngAccessLevel({
    accountStatus: user.accountStatus,
    verificationStatus: ongProfile?.verificationStatus,
  });

  return (
    <OngProfileManagementPage
      user={{
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        accountStatus: user.accountStatus,
      }}
      accessLevel={accessLevel}
      verificationStatus={ongProfile?.verificationStatus}
    />
  );
}
