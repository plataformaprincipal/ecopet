import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { PetOsDashboard } from "@/components/features/client/petos/petos-dashboard";

export default async function ClientPetOsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/cliente/pet-os");
  if (user.role !== UserRole.CLIENT) redirect(dashboardPathForRole(user.role));

  return <PetOsDashboard userName={user.name} />;
}
