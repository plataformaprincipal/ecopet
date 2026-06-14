import { GestorDashboard } from "@/components/features/gestor/gestor-dashboard";
import { GestorPageHeader } from "@/components/features/gestor/gestor-shell";

export default function GestorHomePage() {
  return (
    <>
      <GestorPageHeader
        title="Dashboard Executivo"
        description="Visão geral da plataforma ECOPET — dados reais do banco de dados"
      />
      <GestorDashboard />
    </>
  );
}
