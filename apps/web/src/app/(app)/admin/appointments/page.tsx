import { AdminSectionPanel } from "@/components/features/admin/admin-section-panel";

export default function AdminAppointmentsPage() {
  return (
    <AdminSectionPanel
      title="Agendamentos"
      description="Agendamentos de serviços."
      endpoint="appointments"
    />
  );
}
