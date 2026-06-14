import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { PartnerAppointmentsPanel } from "@/components/features/foundation/partner-appointments-panel";

type Props = { params: Promise<{ appointmentId: string }> };

export default async function PartnerAppointmentDetailPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/partner/appointments");
  if (user.role !== UserRole.PARTNER) redirect(dashboardPathForRole(user.role));
  const { appointmentId } = await params;
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Agendamento</h1>
      <PartnerAppointmentsPanel appointmentId={appointmentId} />
    </main>
  );
}
