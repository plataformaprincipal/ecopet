import { AdminSectionPanel } from "@/components/features/admin/admin-section-panel";

export default function AdminOrdersPage() {
  return (
    <AdminSectionPanel
      title="Pedidos"
      description="Pedidos realizados na plataforma."
      endpoint="orders"
    />
  );
}
