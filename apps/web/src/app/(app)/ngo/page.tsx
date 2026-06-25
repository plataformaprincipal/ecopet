import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { prisma } from "@/lib/prisma";
import { NgoHomeDashboard } from "@/components/features/ong/experience/ngo-home-dashboard";

export default async function NgoHomeRoute() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/ngo");
  if (user.role !== UserRole.ONG) redirect(dashboardPathForRole(user.role));

  const ongProfile = await prisma.ongProfile.findUnique({
    where: { userId: user.id },
    select: { ongName: true, name: true },
  });

  return <NgoHomeDashboard ngoName={ongProfile?.ongName ?? ongProfile?.name ?? user.name} />;
}
