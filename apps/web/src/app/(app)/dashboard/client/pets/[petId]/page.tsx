import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { ClientPetDetailPanel } from "@/components/features/foundation/client-pet-detail-panel";

export default async function ClientPetDetailPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/client/pets");
  if (user.role !== UserRole.CLIENT) redirect(dashboardPathForRole(user.role));
  return (
    <main className="mx-auto max-w-2xl p-6">
      <ClientPetDetailPanel />
    </main>
  );
}
