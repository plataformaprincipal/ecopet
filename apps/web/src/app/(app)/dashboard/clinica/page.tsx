import { RoleDashboard } from "@/components/dashboard/role-dashboard";

export default function ClinicaDashboardPage() {
  return (
    <RoleDashboard
      title="Dashboard Clínica"
      description="Equipe, serviços, emergências e horários de funcionamento."
      actions={[
        { href: "/clinicas", label: "Ver clínicas" },
        { href: "/configuracoes", label: "Configurações" },
      ]}
    />
  );
}
