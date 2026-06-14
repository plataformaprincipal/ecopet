import { RoleDashboard } from "@/components/features/dashboard/role-dashboard";

export default function VeterinarioDashboardPage() {
  return (
    <RoleDashboard
      title="Dashboard Veterinário"
      description="Agenda, teleatendimento, prontuários e consultas."
      actions={[
        { href: "/chat", label: "Mensagens" },
        { href: "/configuracoes", label: "Configurações" },
      ]}
    />
  );
}
