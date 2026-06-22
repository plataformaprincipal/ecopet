import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { prisma } from "@/lib/prisma";
import { getOngAccessLevel } from "@/lib/ong/access";
import { OngShell } from "@/components/features/ong/ong-shell";

export default async function OngAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/ong");
  if (user.role !== UserRole.ONG) redirect(dashboardPathForRole(user.role));

  const ongProfile = await prisma.ongProfile.findUnique({
    where: { userId: user.id },
    select: {
      ongName: true,
      name: true,
      verificationStatus: true,
    },
  });

  const accessLevel = getOngAccessLevel({
    accountStatus: user.accountStatus,
    verificationStatus: ongProfile?.verificationStatus,
  });

  return (
    <OngShell
      userId={user.id}
      ongName={ongProfile?.ongName ?? ongProfile?.name ?? user.name}
      accountStatus={user.accountStatus}
      verificationStatus={ongProfile?.verificationStatus}
      accessLevel={accessLevel}
    >
      {children}
    </OngShell>
  );
}
