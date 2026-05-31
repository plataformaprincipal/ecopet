import { RoleDashboard } from "@/components/dashboard/role-dashboard";

export default function SellerDashboardPage() {
  return (
    <RoleDashboard
      title="Dashboard Seller"
      description="Pedidos, catálogo, entregas e políticas da loja parceira."
      actions={[
        { href: "/marketplace", label: "Ver loja" },
        { href: "/configuracoes", label: "Configurações" },
      ]}
    />
  );
}
