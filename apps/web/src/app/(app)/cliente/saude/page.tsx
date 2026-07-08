import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { ClientHealthPage } from "@/components/features/client/pages/client-health-page";

export default async function ClientSaudeRoutePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/cliente/saude");
  if (user.role !== UserRole.CLIENT) redirect(dashboardPathForRole(user.role));

  return <ClientHealthPage />;
}
