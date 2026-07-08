import { prisma } from "@/lib/prisma";
import { ClientExperienceShell } from "@/components/features/client/experience/client-experience-shell";
import { guardRole } from "@/lib/auth/guards";
import { UserRole } from "@prisma/client";

export default async function ClientExperienceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await guardRole([UserRole.CLIENT], "/client");

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
