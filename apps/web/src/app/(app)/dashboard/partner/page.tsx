import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { FoundationRolePanel } from "@/components/features/foundation/role-panel";

export default async function PartnerDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/partner");
  if (user.role !== UserRole.PARTNER) redirect(dashboardPathForRole(user.role));

  return (
    <FoundationRolePanel
      user={user}
      title="Painel do Parceiro"
      description="Área de gestão para parceiros comerciais e prestadores."
    />
  );
}
