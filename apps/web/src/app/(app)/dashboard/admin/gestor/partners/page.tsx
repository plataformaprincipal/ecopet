import { GestorSectionPanel } from "@/components/features/gestor-admin/gestor-section-panel";

export default function GestorPartnersPage() {
  return (
    <GestorSectionPanel
      title="Parceiros"
      description="CNPJ mascarado. Aprovação detalhada em /dashboard/admin/accounts/partners."
      endpoint="partners"
      exportType="partners"
    />
  );
}
