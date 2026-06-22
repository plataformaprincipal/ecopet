import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { ClientDashboardHome } from "@/components/features/client/pages/client-dashboard-home";

export default async function ClientHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/cliente");
  if (user.role !== UserRole.CLIENT) redirect(dashboardPathForRole(user.role));

  return <ClientDashboardHome userName={user.name} />;
}
