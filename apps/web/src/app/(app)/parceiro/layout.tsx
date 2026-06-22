import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { prisma } from "@/lib/prisma";
import { getPartnerAccessLevel } from "@/lib/partner/access";
import { PartnerShell } from "@/components/features/partner/partner-shell";

export default async function PartnerAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/parceiro/comunidade");
  if (user.role !== UserRole.PARTNER) redirect(dashboardPathForRole(user.role));

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
