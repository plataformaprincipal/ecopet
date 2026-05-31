import { GestorDashboard } from "@/components/gestor/gestor-dashboard";
import { GestorPageHeader } from "@/components/gestor/gestor-shell";

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
