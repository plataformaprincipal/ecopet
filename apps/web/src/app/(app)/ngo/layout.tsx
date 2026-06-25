import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { prisma } from "@/lib/prisma";
import { getOngAccessLevel } from "@/lib/ong/access";
import { NgoExperienceShell } from "@/components/features/ong/experience/ngo-experience-shell";

function resolveStatusTone(
  accountStatus: string,
  verificationStatus?: string | null
): "pending" | "approved" | "suspended" | "rejected" {
  if (accountStatus === "SUSPENDED") return "suspended";
  if (accountStatus === "REJECTED" || verificationStatus === "REJECTED") return "rejected";
  if (accountStatus === "ACTIVE" && verificationStatus === "APPROVED") return "approved";
  return "pending";
}

export default async function NgoExperienceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/ngo");
  if (user.role !== UserRole.ONG) redirect(dashboardPathForRole(user.role));

  const ongProfile = await prisma.ongProfile.findUnique({
    where: { userId: user.id },
    select: { ongName: true, name: true, verificationStatus: true },
  });

  const accessLevel = getOngAccessLevel({
    accountStatus: user.accountStatus,
    verificationStatus: ongProfile?.verificationStatus,
  });

  const statusTone = resolveStatusTone(user.accountStatus, ongProfile?.verificationStatus);

  return (
    <NgoExperienceShell
      ngoName={ongProfile?.ongName ?? ongProfile?.name ?? user.name}
      accessLevel={accessLevel}
      statusTone={statusTone}
    >
      {children}
    </NgoExperienceShell>
  );
}
