import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { PartnerAgendaServicesPage } from "@/components/features/partner/pages/partner-agenda-services-page";

export default async function AgendaServicosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/parceiro/agenda-servicos");
  if (user.role !== UserRole.PARTNER) redirect(dashboardPathForRole(user.role));

  return <PartnerAgendaServicesPage partnerId={user.id} />;
}
