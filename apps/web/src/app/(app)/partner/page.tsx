import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { prisma } from "@/lib/prisma";
import { PartnerHomeDashboard } from "@/components/features/partner/experience/partner-home-dashboard";

export default async function PartnerHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/partner");
  if (user.role !== UserRole.PARTNER) redirect(dashboardPathForRole(user.role));

  const profile = await prisma.partnerProfile.findUnique({
    where: { userId: user.id },
    select: { businessName: true },
  });

  return <PartnerHomeDashboard businessName={profile?.businessName ?? user.name} />;
}
