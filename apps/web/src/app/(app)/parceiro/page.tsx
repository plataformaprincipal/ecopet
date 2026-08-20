import { prisma } from "@/lib/prisma";
import { guardPartner } from "@/lib/auth/guards";
import { PartnerHomeDashboard } from "@/components/features/partner/experience/partner-home-dashboard";

export default async function PartnerAreaIndexPage() {
  const user = await guardPartner("/parceiro");
  const partnerProfile = await prisma.partnerProfile.findUnique({
    where: { userId: user.id },
    select: { businessName: true },
  });
  return <PartnerHomeDashboard businessName={partnerProfile?.businessName ?? user.name} />;
}
