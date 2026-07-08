import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { ClientIaPage } from "@/components/features/client/pages/client-ia-page";

export default async function ClienteIaRoutePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/cliente/ia");
  if (user.role !== UserRole.CLIENT) redirect(dashboardPathForRole(user.role));
  return <ClientIaPage />;
}
