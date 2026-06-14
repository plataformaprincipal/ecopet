import { GestorPageHeader } from "@/components/features/gestor/gestor-shell";
import { ObservabilityPanel } from "@/components/features/platform/gestor-centers";

export default function GestorObservabilityPage() {
  return (
    <>
      <GestorPageHeader title="Observabilidade" description="Monitoramento técnico da plataforma ECOPET" />
      <ObservabilityPanel />
    </>
  );
}
