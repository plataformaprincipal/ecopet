import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPartnerAccessLevel } from "@/lib/partner/access";
import { PartnerExperienceShell } from "@/components/features/partner/experience/partner-experience-shell";
import { guardPartner } from "@/lib/auth/guards";

function resolveStatusTone(
  accountStatus: string,
  verificationStatus?: string | null
): "pending" | "approved" | "suspended" | "rejected" {
  if (accountStatus === "SUSPENDED") return "suspended";
  if (accountStatus === "REJECTED" || verificationStatus === "REJECTED") return "rejected";
  if (accountStatus === "ACTIVE" && verificationStatus === "APPROVED") return "approved";
  return "pending";
}

export default async function PartnerExperienceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await guardPartner("/partner");

  const partnerProfile = await prisma.partnerProfile.findUnique({
    where: { userId: user.id },
    select: { businessName: true, verificationStatus: true },
  });

  const accessLevel = getPartnerAccessLevel({
    accountStatus: user.accountStatus,
    verificationStatus: partnerProfile?.verificationStatus,
  });

  const statusTone = resolveStatusTone(user.accountStatus, partnerProfile?.verificationStatus);

  return (
    <PartnerExperienceShell
      businessName={partnerProfile?.businessName ?? user.name}
      accessLevel={accessLevel}
      statusTone={statusTone}
    >
      {children}
    </PartnerExperienceShell>
  );
}
