import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { ClientAppointmentsPanel } from "@/components/features/foundation/client-appointments-panel";

type Props = { searchParams: Promise<{ serviceId?: string }> };

export default async function ClientAppointmentNewPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/client/appointments/new");
  if (user.role !== UserRole.CLIENT) redirect(dashboardPathForRole(user.role));
  const { serviceId } = await searchParams;
  if (!serviceId) redirect("/dashboard/client/services");
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Novo agendamento</h1>
      <ClientAppointmentsPanel mode="new" serviceId={serviceId} />
    </main>
  );
}
