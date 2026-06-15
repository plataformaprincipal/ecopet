import { GestorSectionPanel } from "@/components/features/gestor-admin/gestor-section-panel";

export default function GestorMarketplacePage() {
  return (
    <GestorSectionPanel
      title="Marketplace"
      description="Produtos, serviços e pedidos — volume bruto, não receita confirmada."
      endpoint="marketplace"
      showFilters={false}
    />
  );
}
