import { GestorSectionPanel } from "@/components/features/gestor-admin/gestor-section-panel";

export default function GestorOngsPage() {
  return (
    <GestorSectionPanel
      title="ONGs"
      description="Métricas e interações reais das organizações cadastradas."
      endpoint="ongs"
      exportType="ongs"
    />
  );
}
