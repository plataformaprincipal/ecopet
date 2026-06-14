import { GestorPageHeader } from "@/components/features/gestor/gestor-shell";
import { FeatureManagementPanel } from "@/components/features/platform/gestor-centers";

export default function GestorFeaturesPage() {
  return (
    <>
      <GestorPageHeader title="Feature Management" description="Ativar/desativar módulos globalmente sem deploy" />
      <FeatureManagementPanel />
    </>
  );
}
