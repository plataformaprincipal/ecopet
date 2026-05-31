import { GestorPageHeader } from "@/components/gestor/gestor-shell";
import { ObservabilityPanel } from "@/components/platform/gestor-centers";

export default function GestorObservabilityPage() {
  return (
    <>
      <GestorPageHeader title="Observabilidade" description="Monitoramento técnico da plataforma ECOPET" />
      <ObservabilityPanel />
    </>
  );
}
