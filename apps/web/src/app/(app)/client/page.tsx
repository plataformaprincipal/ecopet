import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { ClientHomeDashboard } from "@/components/features/client/experience/client-home-dashboard";

export default async function ClientHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/client");
  if (user.role !== UserRole.CLIENT) redirect(dashboardPathForRole(user.role));

  return <ClientHomeDashboard userName={user.name} />;
}
