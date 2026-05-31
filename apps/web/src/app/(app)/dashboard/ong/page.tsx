import { RoleDashboard } from "@/components/dashboard/role-dashboard";

export default function OngDashboardPage() {
  return (
    <RoleDashboard
      title="Dashboard ONG / Protetor"
      description="Adoções, resgates, campanhas e doações."
      actions={[
        { href: "/adocao", label: "Adoção" },
        { href: "/configuracoes", label: "Configurações" },
      ]}
    />
  );
}
