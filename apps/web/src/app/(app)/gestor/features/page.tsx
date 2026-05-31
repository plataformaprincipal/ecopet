import { GestorPageHeader } from "@/components/gestor/gestor-shell";
import { FeatureManagementPanel } from "@/components/platform/gestor-centers";

export default function GestorFeaturesPage() {
  return (
    <>
      <GestorPageHeader title="Feature Management" description="Ativar/desativar módulos globalmente sem deploy" />
      <FeatureManagementPanel />
    </>
  );
}
