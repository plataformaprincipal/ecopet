import { RoleDashboard } from "@/components/dashboard/role-dashboard";

export default function PetshopDashboardPage() {
  return (
    <RoleDashboard
      title="Dashboard Pet Shop"
      description="Produtos, serviços, estoque e horários."
      actions={[
        { href: "/marketplace", label: "Marketplace" },
        { href: "/configuracoes", label: "Configurações" },
      ]}
    />
  );
}
