import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { FoundationRolePanel } from "@/components/features/foundation/role-panel";

export default async function OngDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/ong");
  if (user.role !== UserRole.ONG) redirect(dashboardPathForRole(user.role));

  return (
    <FoundationRolePanel
      user={user}
      title="Painel da ONG"
      description="Área de gestão para organizações e protetores."
    />
  );
}
