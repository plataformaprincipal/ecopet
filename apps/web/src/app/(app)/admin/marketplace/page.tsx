import { AdminSectionPanel } from "@/components/features/admin/admin-section-panel";

export default function AdminMarketplacePage() {
  return (
    <AdminSectionPanel
      title="Marketplace"
      description="Produtos e serviços cadastrados na plataforma."
      endpoint="marketplace"
    />
  );
}
