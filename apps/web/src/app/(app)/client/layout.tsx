import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { prisma } from "@/lib/prisma";
import { ClientExperienceShell } from "@/components/features/client/experience/client-experience-shell";

export default async function ClientExperienceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/client");
  if (user.role !== UserRole.CLIENT) redirect(dashboardPathForRole(user.role));

  const pet = await prisma.pet.findFirst({
    where: { ownerId: user.id, deletedAt: null },
    select: { name: true, species: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ClientExperienceShell
      userName={user.name}
      primaryPet={pet ? { name: pet.name, species: pet.species ?? undefined } : null}
    >
      {children}
    </ClientExperienceShell>
  );
}
