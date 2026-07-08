import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { ClientRoutinePage } from "@/components/features/client/pages/client-routine-page";

export default async function ClientRotinaRoutePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/cliente/rotina");
  if (user.role !== UserRole.CLIENT) redirect(dashboardPathForRole(user.role));

  return <ClientRoutinePage />;
}
