import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { ClientRelatoriosPage } from "@/components/features/client/pages/client-relatorios-page";

export default async function ClienteRelatoriosRoutePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/cliente/relatorios");
  if (user.role !== UserRole.CLIENT) redirect(dashboardPathForRole(user.role));
  return <ClientRelatoriosPage />;
}
