import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { ClientFinanceiroPage } from "@/components/features/client/pages/client-financeiro-page";

export default async function ClienteFinanceiroRoutePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/cliente/financeiro");
  if (user.role !== UserRole.CLIENT) redirect(dashboardPathForRole(user.role));
  return <ClientFinanceiroPage />;
}
