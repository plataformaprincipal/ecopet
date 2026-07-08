import { prisma } from "@/lib/prisma";
import { getOngAccessLevel } from "@/lib/ong/access";
import { OngShell } from "@/components/features/ong/ong-shell";
import { guardNgo } from "@/lib/auth/guards";

export default async function OngAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await guardNgo("/ong");

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
