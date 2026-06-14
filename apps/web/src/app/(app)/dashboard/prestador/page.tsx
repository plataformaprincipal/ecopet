import { RoleDashboard } from "@/components/features/dashboard/role-dashboard";

export default function PrestadorDashboardPage() {
  return (
    <RoleDashboard
      title="Dashboard Prestador"
      description="Serviços, agenda, área de atendimento e solicitações."
      actions={[
        { href: "/marketplace", label: "Serviços" },
        { href: "/configuracoes", label: "Configurações" },
      ]}
    />
  );
}
