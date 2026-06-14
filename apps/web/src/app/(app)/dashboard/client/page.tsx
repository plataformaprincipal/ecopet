import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { FoundationRolePanel } from "@/components/features/foundation/role-panel";

export default async function ClientDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/client");
  if (user.role !== UserRole.CLIENT) redirect(dashboardPathForRole(user.role));

  return (
    <FoundationRolePanel
      user={user}
      title="Painel do Cliente"
      description="Área do tutor e responsável por pets na ECOPET."
    />
  );
}
