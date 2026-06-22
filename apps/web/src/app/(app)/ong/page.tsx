import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { prisma } from "@/lib/prisma";
import { getOngAccessLevel } from "@/lib/ong/access";
import { OngDashboardHome } from "@/components/features/ong/pages/ong-dashboard-home";

export default async function OngHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/ong");
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
    <OngDashboardHome
      userName={user.name}
      accountStatus={user.accountStatus}
      verificationStatus={ongProfile?.verificationStatus}
      accessLevel={accessLevel}
    />
  );
}
