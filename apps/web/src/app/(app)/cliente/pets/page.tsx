import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { ClientMyPetPage } from "@/components/features/client/pages/client-my-pet-page";

export default async function ClientPetsRoutePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/cliente/pets");
  if (user.role !== UserRole.CLIENT) redirect(dashboardPathForRole(user.role));

  return <ClientMyPetPage />;
}
