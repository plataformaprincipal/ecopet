import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { ClientGamificacaoPage } from "@/components/features/client/pages/client-gamificacao-page";

export default async function ClienteGamificacaoRoutePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/cliente/gamificacao");
  if (user.role !== UserRole.CLIENT) redirect(dashboardPathForRole(user.role));
  return <ClientGamificacaoPage />;
}
