import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { prisma } from "@/lib/prisma";
import { getOngAccessLevel } from "@/lib/ong/access";
import { OngCommunityPage } from "@/components/features/ong/pages/ong-community-page";

export default async function OngCommunityRoute() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/ong/comunidade");
  if (user.role !== UserRole.ONG) redirect(dashboardPathForRole(user.role));

  const ongProfile = await prisma.ongProfile.findUnique({
    where: { userId: user.id },
    select: { verificationStatus: true },
  });

  const accessLevel = getOngAccessLevel({
    accountStatus: user.accountStatus,
    verificationStatus: ongProfile?.verificationStatus,
  });

  return <OngCommunityPage ongId={user.id} accessLevel={accessLevel} />;
}
