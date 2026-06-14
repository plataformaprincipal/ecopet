import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import Link from "next/link";
import { ClientAppointmentsPanel } from "@/components/features/foundation/client-appointments-panel";

export default async function ClientAppointmentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/client/appointments");
  if (user.role !== UserRole.CLIENT) redirect(dashboardPathForRole(user.role));
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Meus agendamentos</h1>
      <ClientAppointmentsPanel />
      <Link href="/dashboard/client" className="mt-4 inline-block text-sm underline">Voltar</Link>
    </main>
  );
}
