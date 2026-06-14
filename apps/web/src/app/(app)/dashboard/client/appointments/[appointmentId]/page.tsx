import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { ClientAppointmentsPanel } from "@/components/features/foundation/client-appointments-panel";

type Props = { params: Promise<{ appointmentId: string }> };

export default async function ClientAppointmentDetailPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/client/appointments");
  if (user.role !== UserRole.CLIENT) redirect(dashboardPathForRole(user.role));
  const { appointmentId } = await params;
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Agendamento</h1>
      <ClientAppointmentsPanel mode="detail" appointmentId={appointmentId} />
    </main>
  );
}
