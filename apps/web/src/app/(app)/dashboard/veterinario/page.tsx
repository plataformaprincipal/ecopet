import { RoleDashboard } from "@/components/features/dashboard/role-dashboard";

export default function VeterinarioDashboardPage() {
  return (
    <RoleDashboard
      title="Dashboard Veterinário"
      description="Agenda, teleatendimento, prontuários e consultas."
      actions={[
        { href: "/clinica/teleconsulta", label: "Teleconsulta e laudos" },
        { href: "/chat", label: "Mensagens" },
        { href: "/configuracoes", label: "Configurações" },
      ]}
    />
  );
}
