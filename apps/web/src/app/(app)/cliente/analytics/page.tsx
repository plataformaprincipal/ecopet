import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { ClientAnalyticsPage } from "@/components/features/client/pages/client-analytics-page";

export default async function ClienteAnalyticsRoutePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/cliente/analytics");
  if (user.role !== UserRole.CLIENT) redirect(dashboardPathForRole(user.role));
  return <ClientAnalyticsPage />;
}
