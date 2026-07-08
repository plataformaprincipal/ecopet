import { prisma } from "@/lib/prisma";
import { getPartnerAccessLevel } from "@/lib/partner/access";
import { PartnerShell } from "@/components/features/partner/partner-shell";
import { guardPartner } from "@/lib/auth/guards";

export default async function PartnerAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await guardPartner("/parceiro");

  const partnerProfile = await prisma.partnerProfile.findUnique({
    where: { userId: user.id },
    select: {
      businessName: true,
      verificationStatus: true,
    },
  });

  const accessLevel = getPartnerAccessLevel({
    accountStatus: user.accountStatus,
    verificationStatus: partnerProfile?.verificationStatus,
  });

  return (
    <PartnerShell
      userId={user.id}
      businessName={partnerProfile?.businessName ?? user.name}
      accountStatus={user.accountStatus}
      verificationStatus={partnerProfile?.verificationStatus}
      accessLevel={accessLevel}
    >
      {children}
    </PartnerShell>
  );
}
